import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ResponsivePie } from '@nivo/pie';
import {
  Ticket,
  Mail,
  Clock,
  MessageCircle,
  ClipboardList,
  RefreshCcw,
  BookOpen,
  Send
} from 'lucide-react';
import {
  FaRegCheckCircle,
  FaHourglassHalf,
  FaClipboardList
} from 'react-icons/fa';
import { GoChecklist } from 'react-icons/go';
import { RiFileListFill } from 'react-icons/ri';
import { fetchCustomerCareDashboard } from '../store/redux/analysisSlice';

const CustomerCareDashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.dashboard.customerCare);

  useEffect(() => {
    dispatch(fetchCustomerCareDashboard());
  }, [dispatch]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
        <span className="ml-4">Loading customer care dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">Error: {error}</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen text-lg">No data available.</div>;
  }

  const {
    summary,
    myTickets,
    inquiries,
    knowledgeBase,
    activity
  } = data;

  const getPieChartData = (ticketStats) => {
    if (!ticketStats) return [];
    return ticketStats.map(stat => ({
      id: stat._id,
      label: stat._id,
      value: stat.count,
    }));
  };

  return (
    <motion.div
      className="p-8 bg-background text-foreground min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">Customer Care Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage tickets, view recent inquiries, and track your performance.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <Ticket className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">Total Tickets</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{summary?.totalTickets || 0}</h2>
        </motion.div>
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <Clock className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">Avg. Resolution Time</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{summary?.avgResolutionTime || 0}d</h2>
        </motion.div>
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <MessageCircle className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">New Contacts</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{inquiries?.recentContacts?.length || 0}</h2>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.section className="col-span-1 lg:col-span-2 space-y-8" variants={containerVariants}>
          
          {/* Ticket Status Breakdown */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><RiFileListFill className="text-primary" />Ticket Status Overview</h3>
            <div className="h-[300px]">
              <ResponsivePie
                data={getPieChartData(summary.ticketCountsByStatus)}
                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                innerRadius={0.6}
                padAngle={1.5}
                cornerRadius={5}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="var(--foreground)"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="var(--card-foreground)"
                theme={{
                  textColor: 'var(--foreground)',
                  labels: {
                    text: {
                      fontSize: 14,
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* My Assigned Tickets */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><GoChecklist className="text-primary" />My Open Tickets</h3>
            <ul className="space-y-4">
              {myTickets.myOpenTickets?.length > 0 ? (
                myTickets.myOpenTickets.map((ticket) => (
                  <li key={ticket._id} className="p-4 bg-muted rounded-xl flex items-start space-x-4">
                    <div className="p-2 bg-secondary rounded-full flex-shrink-0">
                      <Ticket size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground truncate">{ticket.subject}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Assigned to: <span className="font-medium text-foreground">{ticket.assignedTo?.profileInfo?.firstName || 'You'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Priority: <span className={`font-medium capitalize ${ticket.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>{ticket.priority}</span>
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex-shrink-0">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">You have no open tickets. Great job! 🎉</p>
              )}
            </ul>
          </motion.div>
        </motion.section>

        {/* Sidebar */}
        <motion.section className="col-span-1 space-y-8" variants={containerVariants}>
          
          {/* Recent Customer Contacts */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Mail className="text-primary" />Recent Contacts</h3>
            <ul className="space-y-4">
              {inquiries.recentContacts?.length > 0 ? (
                inquiries.recentContacts.map((contact) => (
                  <li key={contact._id} className="p-3 bg-muted rounded-lg border-l-4 border-accent">
                    <h4 className="font-semibold text-foreground">{contact.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{contact.subject}</p>
                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="text-muted-foreground">Status: <span className="font-medium capitalize">{contact.status}</span></span>
                      <Send size={16} className="text-secondary-foreground" />
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No recent contacts found.</p>
              )}
            </ul>
          </motion.div>

          {/* Announcements */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><ClipboardList className="text-primary" />Recent Announcements</h3>
            <ul className="space-y-4">
              {knowledgeBase.recentAnnouncements?.length > 0 ? (
                knowledgeBase.recentAnnouncements.map((announcement) => (
                  <li key={announcement._id} className="p-3 bg-muted rounded-lg flex flex-col space-y-1">
                    <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground self-end">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No recent announcements.</p>
              )}
            </ul>
          </motion.div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default CustomerCareDashboard;