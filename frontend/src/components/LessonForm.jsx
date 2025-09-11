import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLesson, updateLesson, createLessonAI } from '../store/redux/courseContentSlice'; // Import createLessonAI
import { uploadSingleFile } from '../store/redux/uploadSlice';
import { X, Upload, Trash2, Video, FileText, Code, HelpCircle, Award, Plus, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Reusable Tag Input Component
const TagInput = ({ tags, onTagsChange, placeholder = 'Add tags...' }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg border-border bg-muted min-h-[40px]">
        {tags.map((tag, index) => (
          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium bg-secondary text-secondary-foreground rounded-full">
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent focus:outline-none"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

// Helper function to create initial state for different lesson types
const createInitialLessonState = (type) => {
  const baseState = {
    title: '',
    description: '',
    isFree: false,
    resources: [],
    type: type,
  };

  switch (type) {
    case 'video':
      return { ...baseState, content: { video: { duration: 0, videoUrl: '' } } };
    case 'article':
      return {
        ...baseState,
        content: {
          article: {
            content: '',
            excerpt: '',
            author: '',
            featuredImage: '',
            category: 'Web Development',
            tags: [],
            isPublished: false,
            meta: { views: 0, likes: [] },
            comments: [],
          },
        },
      };
    case 'codingProblem':
      return {
        ...baseState,
        content: {
          codingProblem: {
            description: '',
            difficulty: 'medium',
            starterCode: '',
            solutionCode: '',
            testCases: [],
            allowedLanguages: ['javascript', 'python'],
            points: 10,
            hints: [],
            topics: [],
          },
        },
      };
    case 'quiz':
      return {
        ...baseState,
        content: {
          quiz: {
            quizInstructions: '',
            questions: [],
            passScore: 50,
            attemptsAllowed: 1,
            shuffleQuestions: false,
            showCorrectAnswersImmediately: false,
          },
        },
      };
    case 'contest':
      return {
        ...baseState,
        content: {
          contest: {
            description: '',
            startTime: '',
            endTime: '',
            problems: [],
            maxParticipants: 100,
            isPublic: true,
            rules: [],
            prices: [],
            status: 'upcoming',
          },
        },
      };
    default:
      return baseState;
  }
};

const LessonForm = ({ lesson, chapterId, onClose, courseId, isAILessonCreation }) => {
  const dispatch = useDispatch();
  const { singleFileStatus } = useSelector((state) => state.upload);
  const { courses } = useSelector((state) => state.courseContent);
  const { user } = useSelector((state) => state.auth);

  const currentCourse = useMemo(() => courses.find(c => c._id === courseId), [courses, courseId]);
  const currentChapter = useMemo(() =>
    currentCourse?.chapters?.find(ch => ch._id === chapterId),
    [currentCourse, chapterId]
  );

  const [formData, setFormData] = useState(() =>
    lesson
      ? { ...createInitialLessonState(lesson.type), ...lesson }
      : createInitialLessonState('video')
  );

  const [aiPrompt, setAiPrompt] = useState(''); // New state for AI prompt

  const [resourceFile, setResourceFile] = useState(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('pdf');
  const [resourceUrl, setResourceUrl] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);

  useEffect(() => {
    if (lesson) {
      setFormData({ ...createInitialLessonState(lesson.type), ...lesson });
    } else {
      setFormData(createInitialLessonState('video'));
      setAiPrompt(''); // Clear AI prompt when creating a new lesson
    }
  }, [lesson, isAILessonCreation]); // Add isAILessonCreation to dependency array

  const handleBaseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLessonTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({
      ...createInitialLessonState(newType),
      title: formData.title,
      description: formData.description,
      isFree: formData.isFree,
      type: newType,
    });
  };

  const handleNestedChange = (e, parentKey, nestedKey) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [nestedKey]: {
          ...(prev[parentKey]?.[nestedKey] || {}),
          [name]: type === 'checkbox' ? checked : value,
        },
      },
    }));
  };

  const handleDynamicArrayChange = (parentKey, nestedKey, arrayKey, itemIndex, newPartialItem) => {
    setFormData((prev) => {
      const updatedParent = { ...prev[parentKey] };
      const updatedNested = { ...updatedParent[nestedKey] };
      const updatedArray = [...(updatedNested[arrayKey] || [])];
      updatedArray[itemIndex] = { ...updatedArray[itemIndex], ...newPartialItem };
      return {
        ...prev,
        [parentKey]: { ...updatedParent, [nestedKey]: { ...updatedNested, [arrayKey]: updatedArray } },
      };
    });
  };

  const handleAddDynamicItem = (parentKey, nestedKey, arrayKey, newItem) => {
    setFormData((prev) => {
      const updatedParent = { ...prev[parentKey] };
      const updatedNested = { ...updatedParent[nestedKey] };
      return {
        ...prev,
        [parentKey]: { ...updatedParent, [nestedKey]: { ...updatedNested, [arrayKey]: [...(updatedNested[arrayKey] || []), newItem] } },
      };
    });
  };

  const handleRemoveDynamicItem = (parentKey, nestedKey, arrayKey, indexToRemove) => {
    setFormData((prev) => {
      const updatedParent = { ...prev[parentKey] };
      const updatedNested = { ...updatedParent[nestedKey] };
      const updatedArray = [...(updatedNested[arrayKey] || [])];
      updatedArray.splice(indexToRemove, 1);
      return {
        ...prev,
        [parentKey]: { ...updatedParent, [nestedKey]: { ...updatedNested, [arrayKey]: updatedArray } },
      };
    });
  };

  const handleTagsChange = (parentKey, nestedKey, arrayKey, newTags) => {
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [nestedKey]: {
          ...(prev[parentKey]?.[nestedKey] || {}),
          [arrayKey]: newTags,
        },
      },
    }));
  };

  const handleResourceAdd = async () => {
    if (!resourceTitle.trim()) {
      toast.error("Please add a title for the resource.");
      return;
    }

    let url = '';

    if (resourceFile) {
      try {
        const response = await dispatch(uploadSingleFile(resourceFile)).unwrap();
        url = response?.data?.fileUrl;
        if (!url) {
          throw new Error("No URL returned from upload.");
        }
      } catch (error) {
        console.error("Error uploading resource:", error);
        toast.error("Failed to upload resource. Please try again.");
        return;
      }
    } else if (resourceUrl.trim()) {
      url = resourceUrl;
    } else {
      toast.error("Please either upload a file or paste a URL.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      resources: [...(prev.resources || []), {
        title: resourceTitle,
        url: url,
        type: resourceType,
      }],
    }));

    setResourceFile(null);
    setResourceTitle('');
    setResourceType('pdf');
    setResourceUrl('');
    toast.success("Resource added successfully!");
  };

  const handleRemoveResource = (indexToRemove) => {
    setFormData((prev) => {
      const updatedResources = [...prev.resources];
      updatedResources.splice(indexToRemove, 1);
      return {
        ...prev,
        resources: updatedResources,
      };
    });
  };

  const handleFeaturedImageUpload = async () => {
    if (featuredImageFile) {
      try {
        const response = await dispatch(uploadSingleFile(featuredImageFile)).unwrap();
        const url = response?.data?.fileUrl;

        if (url) {
          setFormData((prev) => ({
            ...prev,
            content: {
              ...prev.content,
              article: {
                ...prev.content.article,
                featuredImage: url,
              },
            },
          }));
          setFeaturedImageFile(null);
          toast.success("Featured image uploaded successfully!");
        } else {
          toast.error("Featured image upload failed: No URL returned.");
        }
      } catch (error) {
        console.error("Error uploading featured image:", error);
        toast.error("Failed to upload featured image.");
      }
    } else {
      toast.error("Please select a file for the featured image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Lesson title is required.");
      return;
    }
    if (!currentChapter) {
      toast.error("Error: Associated chapter not found. Cannot create/update lesson.");
      return;
    }

    // Ensure content for the specific type is present if not AI creation
    if (!isAILessonCreation && !formData.content?.[formData.type]) {
        toast.error(`Please provide content for the ${formData.type} lesson type.`);
        return;
    }

    const finalData = {
      ...formData,
      chapter: chapterId,
      course: courseId,
      // Ensure author is set for articles if not already from AI
      ...(formData.type === 'article' && formData.content?.article && !formData.content.article.author && { content: { ...formData.content, article: { ...formData.content.article, author: user?._id || '' } } }),
    };

    try {
      if (lesson) {
        // Existing lesson is always updated
        await dispatch(updateLesson({ id: lesson._id, lessonData: finalData })).unwrap();
        toast.success("Lesson updated successfully.");
      } else if (isAILessonCreation) {
        // New lesson created via AI
        await dispatch(createLessonAI({ 
          chapterId, 
          title: formData.title, 
          type: formData.type, 
          prompt: aiPrompt 
        })).unwrap();
        toast.success("AI Lesson created successfully.");
      } else {
        // New lesson created manually
        const newOrder = currentChapter?.lessons?.length || 0;
        await dispatch(createLesson({ chapterId, lessonData: { ...finalData, order: newOrder } })).unwrap();
        toast.success("Lesson created successfully.");
      }
      onClose();
    } catch (error) {
      console.error("Failed to submit lesson:", error);
      toast.error(`Failed to ${lesson ? 'update' : (isAILessonCreation ? 'create AI' : 'create')} lesson. Please try again.`);
    }
  };

  const renderDynamicContent = useMemo(() => {
    // Access content fields via formData.content[formData.type]
    const content = formData.content?.[formData.type];

    switch (formData.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <Video size={20} /> Video Content
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Video URL</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={content?.videoUrl || ''}
                  onChange={(e) => handleNestedChange(e, 'content', 'video')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Paste a video URL"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (in minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={content?.duration || 0}
                  onChange={(e) => handleNestedChange(e, 'content', 'video')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                  required
                />
              </div>
            </div>
            {content?.videoUrl && (
              <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
                <h5 className="font-semibold mb-2">Video Preview</h5>
                <video src={content.videoUrl} controls className="w-full rounded-lg" />
              </div>
            )}
          </div>
        );
      case 'article':
        return (
          <div className="space-y-4">
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <FileText size={20} /> Article Content
            </h4>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                name="content"
                value={content?.content || ''}
                onChange={(e) => handleNestedChange(e, 'content', 'article')}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                rows="6"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea
                  name="excerpt"
                  value={content?.excerpt || ''}
                  onChange={(e) => handleNestedChange(e, 'content', 'article')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  maxLength={300}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={content?.category || 'Web Development'}
                  onChange={(e) => handleNestedChange(e, 'content', 'article')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  required
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <TagInput
                tags={content?.tags || []}
                onTagsChange={(newTags) => handleTagsChange('content', 'article', 'tags', newTags)}
                placeholder="e.g., react, javascript"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Featured Image</label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  onChange={(e) => setFeaturedImageFile(e.target.files[0])}
                  className="hidden"
                  id="featured-image-upload"
                />
                <label
                  htmlFor="featured-image-upload"
                  className="flex-grow cursor-pointer p-2 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/80 transition-colors text-sm"
                >
                  {featuredImageFile ? featuredImageFile.name : 'Choose file...'}
                </label>
                <button
                  type="button"
                  onClick={handleFeaturedImageUpload}
                  disabled={!featuredImageFile || singleFileStatus === 'loading'}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {singleFileStatus === 'loading' ? 'Uploading...' : <Upload size={16} />}
                </button>
              </div>
              <input
                type="text"
                name="featuredImage"
                value={content?.featuredImage || ''}
                onChange={(e) => handleNestedChange(e, 'content', 'article')}
                className="w-full px-4 py-2 mt-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                placeholder="Or paste a URL"
              />
              {content?.featuredImage && (
                <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
                  <h5 className="font-semibold mb-2">Image Preview</h5>
                  <img src={content.featuredImage} alt="Featured" className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPublished"
                checked={content?.isPublished || false}
                onChange={(e) => handleNestedChange(e, 'content', 'article')}
                className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
              />
              <label className="text-sm font-medium">Publish Article?</label>
            </div>
          </div>
        );
      case 'codingProblem':
        return (
          <div className="space-y-4">
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <Code size={20} /> Coding Problem
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  value={content?.difficulty || 'medium'}
                  onChange={(e) => handleNestedChange(e, 'content', 'codingProblem')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  name="points"
                  value={content?.points || 10}
                  onChange={(e) => handleNestedChange(e, 'content', 'codingProblem')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Problem Description</label>
              <textarea
                name="description"
                value={content?.description || ''}
                onChange={(e) => handleNestedChange(e, 'content', 'codingProblem')}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                rows="4"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Starter Code</label>
              <textarea
                name="starterCode"
                value={content?.starterCode || ''}
                onChange={(e) => handleNestedChange(e, 'content', 'codingProblem')}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors font-mono"
                rows="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Solution Code</label>
              <textarea
                name="solutionCode"
                value={content?.solutionCode || ''}
                onChange={(e) => handleNestedChange(e, 'content', 'codingProblem')}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors font-mono"
                rows="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Allowed Languages</label>
              <TagInput
                tags={content?.allowedLanguages || []}
                onTagsChange={(newTags) => handleTagsChange('content', 'codingProblem', 'allowedLanguages', newTags)}
                placeholder="e.g., javascript, python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topics</label>
              <TagInput
                tags={content?.topics || []}
                onTagsChange={(newTags) => handleTagsChange('content', 'codingProblem', 'topics', newTags)}
                placeholder="e.g., arrays, recursion"
              />
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">Test Cases</h5>
                <button
                  type="button"
                  onClick={() => handleAddDynamicItem('content', 'codingProblem', 'testCases', { input: '', output: '', isHidden: false })}
                  className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {(content?.testCases || []).map((testCase, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <h6 className="font-medium">Test Case #{index + 1}</h6>
                    <button
                      type="button"
                      onClick={() => handleRemoveDynamicItem('content', 'codingProblem', 'testCases', index)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Input</label>
                    <textarea
                      value={testCase.input || ''}
                      onChange={(e) => handleDynamicArrayChange('content', 'codingProblem', 'testCases', index, { input: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors font-mono"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Output</label>
                    <textarea
                      value={testCase.output || ''}
                      onChange={(e) => handleDynamicArrayChange('content', 'codingProblem', 'testCases', index, { output: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors font-mono"
                      rows="2"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testCase.isHidden || false}
                      onChange={(e) => handleDynamicArrayChange('content', 'codingProblem', 'testCases', index, { isHidden: e.target.checked })}
                      className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                    />
                    <label className="text-sm font-medium">Hidden Test Case</label>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">Hints</h5>
                <button
                  type="button"
                  onClick={() => handleAddDynamicItem('content', 'codingProblem', 'hints', '')}
                  className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <TagInput
                tags={content?.hints || []}
                onTagsChange={(newHints) => handleTagsChange('content', 'codingProblem', 'hints', newHints)}
                placeholder="Enter a hint and press Enter"
              />
            </div>
          </div>
        );
      case 'quiz':
        return (
          <div className="space-y-4">
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle size={20} /> Quiz
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quiz Instructions</label>
                <textarea
                  name="quizInstructions"
                  value={content?.quizInstructions || ''}
                  onChange={(e) => handleNestedChange(e, 'content', 'quiz')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pass Score (%)</label>
                <input
                  type="number"
                  name="passScore"
                  value={content?.passScore || 50}
                  onChange={(e) => handleNestedChange(e, 'content', 'quiz')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attempts Allowed</label>
                <input
                  type="number"
                  name="attemptsAllowed"
                  value={content?.attemptsAllowed || 1}
                  onChange={(e) => handleNestedChange(e, 'content', 'quiz')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="shuffleQuestions"
                  checked={content?.shuffleQuestions || false}
                  onChange={(e) => handleNestedChange(e, 'content', 'quiz')}
                  className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                />
                <label className="text-sm font-medium">Shuffle Questions</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="showCorrectAnswersImmediately"
                  checked={content?.showCorrectAnswersImmediately || false}
                  onChange={(e) => handleNestedChange(e, 'content', 'quiz')}
                  className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                />
                <label className="text-sm font-medium">Show Answers Immediately</label>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">Questions</h5>
                <button
                  type="button"
                  onClick={() =>
                    handleAddDynamicItem('content', 'quiz', 'questions', {
                      questionText: '',
                      questionType: 'multiple-choice',
                      options: [{ optionText: '', isCorrect: false }],
                      correctAnswer: [],
                      explanation: '',
                      points: 1,
                    })
                  }
                  className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {(content?.questions || []).map((question, qIndex) => (
                <div key={qIndex} className="border p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h6 className="font-bold">Question #{qIndex + 1}</h6>
                    <button
                      type="button"
                      onClick={() => handleRemoveDynamicItem('content', 'quiz', 'questions', qIndex)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Question Text</label>
                    <textarea
                      value={question.questionText || ''}
                      onChange={(e) => handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { questionText: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                      rows="2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Question Type</label>
                      <select
                        value={question.questionType || 'multiple-choice'}
                        onChange={(e) => {
                          const newQuestionType = e.target.value;
                          let updatedQuestion = { ...question, questionType: newQuestionType, options: [], correctAnswer: [] };
                          if (newQuestionType === 'single-choice' || newQuestionType === 'multiple-choice') {
                            updatedQuestion.options = [{ optionText: '', isCorrect: false }];
                          }
                          handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, updatedQuestion);
                        }}
                        className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                      >
                        <option value="single-choice">Single-Choice</option>
                        <option value="multiple-choice">Multiple-Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="fill-in-the-blank">Fill-in-the-Blank</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Points</label>
                      <input
                        type="number"
                        value={question.points || 1}
                        onChange={(e) => handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { points: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                        min="1"
                      />
                    </div>
                  </div>
                  {(question.questionType === 'single-choice' || question.questionType === 'multiple-choice') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h6 className="font-medium">Options</h6>
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(question.options || []), { optionText: '', isCorrect: false }];
                            handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { options: newOptions });
                          }}
                          className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {(question.options || []).map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2 items-center">
                          <input
                            type={question.questionType === 'single-choice' ? 'radio' : 'checkbox'}
                            name={`correctAnswer-${qIndex}`}
                            checked={option.isCorrect || false}
                            onChange={() => {
                              const newOptions = question.options.map((opt, i) =>
                                i === oIndex
                                  ? { ...opt, isCorrect: !opt.isCorrect }
                                  : (question.questionType === 'single-choice' ? { ...opt, isCorrect: false } : opt)
                              );
                              handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { options: newOptions });
                            }}
                            className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={option.optionText || ''}
                            onChange={(e) => {
                              const newOptions = question.options.map((opt, i) =>
                                i === oIndex ? { ...opt, optionText: e.target.value } : opt
                              );
                              handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { options: newOptions });
                            }}
                            className="flex-grow px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = question.options.filter((_, i) => i !== oIndex);
                              handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { options: newOptions });
                            }}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(question.questionType === 'short-answer' || question.questionType === 'fill-in-the-blank') && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium mb-1">Correct Answer(s) (comma separated for multiple)</label>
                      <input
                        type="text"
                        value={(question.correctAnswer || []).join(', ')}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { correctAnswer: value ? value.split(',').map(ans => ans.trim()) : [] });
                        }}
                        className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Enter correct answer(s)"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
                    <textarea
                      name="explanation"
                      value={question.explanation || ''}
                      onChange={(e) => handleDynamicArrayChange('content', 'quiz', 'questions', qIndex, { explanation: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                      rows="2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'contest':
        return (
          <div className="space-y-4">
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <Award size={20} /> Contest
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={content?.description || ''}
                  onChange={(e) => handleNestedChange(e, 'content', 'contest')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={content?.startTime || ''}
                  onChange={(e) => handleNestedChange(e, 'content', 'contest')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={content?.endTime || ''}
                  onChange={(e) => handleNestedChange(e, 'content', 'contest')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={content?.maxParticipants || 100}
                  onChange={(e) => handleNestedChange(e, 'content', 'contest')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  min="1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={content?.isPublic || false}
                  onChange={(e) => handleNestedChange(e, 'content', 'contest')}
                  className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
                />
                <label className="text-sm font-medium">Public Contest?</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={content?.status || 'upcoming'}
                  onChange={(e) => handleNestedChange(e, 'content', 'contest')}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">Contest Problems</h5>
                <button
                  type="button"
                  onClick={() => handleAddDynamicItem('content', 'contest', 'problems', { title: '', problemId: '' })}
                  className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {(content?.problems || []).map((problem, index) => (
                <div key={index} className="flex gap-2 items-center border p-2 rounded-lg">
                  <input
                    type="text"
                    value={problem.title || ''}
                    onChange={(e) => handleDynamicArrayChange('content', 'contest', 'problems', index, { ...problem, title: e.target.value })}
                    className="flex-grow px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Problem Title"
                  />
                  <input
                    type="text"
                    value={problem.problemId || ''}
                    onChange={(e) => handleDynamicArrayChange('content', 'contest', 'problems', index, { ...problem, problemId: e.target.value })}
                    className="flex-grow px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Problem ID"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDynamicItem('content', 'contest', 'problems', index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold">Prices</h5>
                <button
                  type="button"
                  onClick={() => handleAddDynamicItem('content', 'contest', 'prices', { position: 0, amount: 0 })} // Changed to match schema
                  className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {(content?.prices || []).map((price, index) => (
                <div key={index} className="flex gap-2 items-center border p-2 rounded-lg">
                  <input
                    type="number" // Changed to number
                    value={price.position || 0} // Changed to position
                    onChange={(e) => handleDynamicArrayChange('content', 'contest', 'prices', index, { ...price, position: parseInt(e.target.value) })}
                    className="w-1/4 px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Position (e.g., 1)"
                  />
                  <input
                    type="number" // Changed to number
                    value={price.amount || 0} // Changed to amount
                    onChange={(e) => handleDynamicArrayChange('content', 'contest', 'prices', index, { ...price, amount: parseInt(e.target.value) })}
                    className="flex-grow px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Amount (e.g., 100)"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDynamicItem('content', 'contest', 'prices', index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [formData, singleFileStatus, user, handleNestedChange, handleAddDynamicItem, handleRemoveDynamicItem, handleDynamicArrayChange, handleTagsChange, dispatch, handleFeaturedImageUpload]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-card text-card-foreground rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h3 className="text-3xl font-bold">{lesson ? 'Edit Lesson' : (isAILessonCreation ? 'Create AI Lesson' : 'Create New Lesson')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleBaseChange}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lesson Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleLessonTypeChange}
                className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                required
                // Removed the disabled prop here to allow selecting type for new AI lessons
              >
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="codingProblem">Coding Problem</option>
                <option value="quiz">Quiz</option>
                <option value="contest">Contest</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleBaseChange}
              className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors min-h-[100px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFree"
              checked={formData.isFree}
              onChange={handleBaseChange}
              className="h-4 w-4 text-primary rounded border-muted-foreground focus:ring-primary"
            />
            <label className="text-sm font-medium">Free Lesson</label>
          </div>

          <hr className="my-6 border-border" />

          {isAILessonCreation && !lesson ? ( // Show AI prompt only for new AI lessons
            <div className="space-y-4">
              <h4 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles size={20} /> AI Prompt for {formData.type}
              </h4>
              <div>
                <label className="block text-sm font-medium mb-1">What should the AI generate?</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors min-h-[150px]"
                  placeholder={`e.g., "Create an article about the basics of React Hooks, focusing on useState and useEffect." or "Generate a medium difficulty coding problem about implementing a binary search tree."`}
                  required
                />
              </div>
            </div>
          ) : (
            renderDynamicContent // Show manual content fields for existing or non-AI new lessons
          )}

          <hr className="my-6 border-border" />

          <div className="space-y-4">
            <h4 className="text-xl font-semibold flex items-center gap-2">
              <FileText size={20} /> Resources
            </h4>
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-1">Resource Title</label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  placeholder="e.g., Lecture Notes PDF"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="pdf">PDF</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 border p-4 rounded-lg bg-muted/50">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <input
                  type="text"
                  value={resourceUrl}
                  onChange={(e) => {
                    setResourceUrl(e.target.value);
                    if (e.target.value) {
                      setResourceFile(null); // Clear file input if URL is being typed
                    }
                  }}
                  className="flex-1 w-full px-4 py-2 border rounded-lg border-border bg-muted text-foreground focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Paste URL here..."
                  disabled={!!resourceFile} // Disable if a file is selected
                />
                <span className="text-muted-foreground text-sm hidden sm:block">OR</span>
                <input
                  type="file"
                  onChange={(e) => {
                    setResourceFile(e.target.files[0]);
                    if (e.target.files[0]) {
                      setResourceUrl(''); // Clear URL input if a file is selected
                    }
                  }}
                  className="hidden"
                  id="resource-upload-file"
                />
                <label htmlFor="resource-upload-file" className="cursor-pointer px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  {resourceFile ? resourceFile.name : 'Choose File...'}
                </label>
              </div>
              <button
                type="button"
                onClick={handleResourceAdd}
                disabled={(!resourceFile && !resourceUrl) || !resourceTitle || singleFileStatus === 'loading'}
                className="w-full flex justify-center items-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {singleFileStatus === 'loading' ? 'Uploading...' : <><Plus size={16} /> Add Resource</>}
              </button>
            </div>
            <div className="space-y-2">
              {formData.resources?.length > 0 ? (
                formData.resources.map((res, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                    {res.type === 'image' ? (
                      <div className="flex items-center gap-4">
                        <img src={res.url} alt={res.title} className="w-12 h-12 object-cover rounded-md" />
                        <span className="truncate">{res.title}</span>
                      </div>
                    ) : (
                      <span className="truncate max-w-[calc(100%-100px)]">{res.title} ({res.type})</span>
                    )}
                    <div className="flex items-center gap-2">
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">View</a>
                      <button
                        type="button"
                        onClick={() => handleRemoveResource(index)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No resources added yet.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              {lesson ? 'Update Lesson' : (isAILessonCreation ? 'Generate AI Lesson' : 'Create Lesson')}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default LessonForm;
