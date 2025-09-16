import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdminDashboard } from '../store/redux/analysisSlice';

// Icons
import {
  Users, DollarSign, Book, FileText, BarChart2,
  Bell, LayoutDashboard, Clock, BadgeHelp,
  FileAxis3D, FileWarning, TrendingUp, TrendingDown,
} from 'lucide-react';
import { FaUserTie, FaTicketAlt } from 'react-icons/fa';
import { BiTimer } from 'react-icons/bi';
import { MdOutlineLocalOffer } from 'react-icons/md';

// Nivo Charts
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';

// Framer Motion for animations
import { motion } from 'framer-motion';

// --- Nivo Chart Themes and configurations ---
const nivoTheme = {
  axis: {
    ticks: {
      text: {
        fill: 'var(--text-custom)',
        fontSize: 10,
        fontFamily: 'var(--font-body)',
      },
    },
    legend: {
      text: {
        fill: 'var(--foreground)',
        fontSize: 12,
        fontFamily: 'var(--font-heading)',
        fontWeight: 'bold',
      },
    },
  },
  grid: {
    line: {
      stroke: 'var(--border)',
      strokeDasharray: '2, 2',
    },
  },
  legends: {
    text: {
      fontSize: 12,
      fontFamily: 'var(--font-body)',
      fill: 'var(--text-custom)',
    },
  },
  tooltip: {
    container: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      fontSize: 12,
      fontFamily: 'var(--font-body)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
      padding: '8px 12px',
    },
  },
};

const barColors = ['var(--primary)', 'var(--accent-foreground)', 'var(--secondary-foreground)', 'var(--muted-foreground)'];
const pieColors = ['var(--primary)', 'var(--accent-foreground)', 'var(--secondary)', 'var(--muted)'];

// --- Reusable Chart Components ---
const NivoLineChart = ({ data }) => (
  <ResponsiveLine
    data={data}
    margin={{ top: 10, right: 30, bottom: 40, left: 50 }}
    xScale={{ type: 'point' }}
    yScale={{
      type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false,
    }}
    yFormat=" >-.2f"
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Month',
      legendOffset: 36,
      legendPosition: 'middle',
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Revenue ($)',
      legendOffset: -40,
      legendPosition: 'middle',
    }}
    pointSize={8}
    pointColor={{ theme: 'background' }}
    pointBorderWidth={2}
    pointBorderColor={{ from: 'serieColor' }}
    pointLabelYOffset={-12}
    enableSlices="x"
    useMesh
    theme={nivoTheme}
    colors={[barColors[0]]}
    enableGridX={false}
    animate
  />
);

const NivoPieChart = ({ data }) => (
  <ResponsivePie
    data={data}
    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
    cornerRadius={3}
    activeOuterRadiusOffset={8}
    borderWidth={1}
    borderColor={{
      from: 'color',
      modifiers: [['darker', 0.2]],
    }}
    arcLinkLabelsSkipAngle={10}
    arcLinkLabelsTextColor="var(--foreground)"
    arcLinkLabelsThickness={2}
    arcLinkLabelsColor={{ from: 'color' }}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor={{
      from: 'color',
      modifiers: [['darker', 2]],
    }}
    legends={[
      {
        anchor: 'bottom',
        direction: 'row',
        justify: false,
        translateX: 0,
        translateY: 56,
        itemsSpacing: 0,
        itemWidth: 100,
        itemHeight: 18,
        itemTextColor: 'var(--text-custom)',
        itemDirection: 'left-to-right',
        itemOpacity: 1,
        symbolSize: 18,
        symbolShape: 'circle',
        effects: [
          {
            on: 'hover',
            style: {
              itemTextColor: 'var(--foreground)',
            },
          },
        ],
      },
    ]}
    colors={pieColors}
    theme={nivoTheme}
    animate
  />
);

const NivoBarChart = ({ data, keys, indexBy }) => (
  <ResponsiveBar
    data={data}
    keys={keys}
    indexBy={indexBy}
    margin={{ top: 10, right: 30, bottom: 40, left: 60 }}
    padding={0.3}
    valueScale={{ type: 'linear' }}
    indexScale={{ type: 'band', round: true }}
    colors={barColors}
    borderColor={{
      from: 'color',
      modifiers: [['darker', 1.6]],
    }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: indexBy.charAt(0).toUpperCase() + indexBy.slice(1),
      legendPosition: 'middle',
      legendOffset: 32,
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Count',
      legendPosition: 'middle',
      legendOffset: -40,
    }}
    labelSkipWidth={12}
    labelSkipHeight={12}
    labelTextColor={{
      from: 'color',
      modifiers: [['darker', 1.6]],
    }}
    animate
    theme={nivoTheme}
    role="application"
  />
);

// --- Custom Components for a professional look ---
const StatCard = ({
  title, value, icon: Icon, color, trend, trendValue,
}) => {
  const isPositive = trend === 'up';
  return (
    <motion.div
      className="flex flex-col p-6 bg-card rounded-2xl shadow-sm border border-border transition-all duration-300 hover:shadow-md hover:border-primary"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-custom uppercase tracking-wide">{title}</h4>
        <div className={`p-2 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      <p className="text-3xl md:text-4xl font-bold text-foreground font-display tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {trend && (
        <div className="flex items-center mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trendValue}%
          </span>
          <span className="text-xs text-custom ml-1">
            vs last period
          </span>
        </div>
      )}
    </motion.div>
  );
};

const DashboardSection = ({ title, children, icon: Icon, className = '' }) => (
  <motion.div
    className={`bg-card p-6 md:p-8 rounded-3xl shadow-md border border-border mt-8 ${className}`}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
  >
    <div className="flex items-center mb-6 border-b border-border pb-4">
      <Icon className="w-7 h-7 mr-3 text-primary" />
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">{title}</h2>
    </div>
    {children}
  </motion.div>
);

const AdminAnalysis = () => {
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.dashboard);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    dispatch(fetchAdminDashboard(period));
  }, [dispatch, period]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  if (admin.loading && !admin.data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LayoutDashboard className="w-16 h-16 text-primary animate-spin" />
        <span className="ml-4 text-xl text-custom font-body">Loading Admin Dashboard...</span>
      </div>
    );
  }

  if (admin.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <FileWarning className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-heading text-foreground mb-2">Error Loading Data</h2>
        <p className="text-lg text-custom">{admin.error}</p>
      </div>
    );
  }

  if (!admin.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <FileAxis3D className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-heading text-custom mb-2">No Data Available</h2>
        <p className="text-lg text-custom">Please check your data source or try a different time period.</p>
      </div>
    );
  }

  const {
    summary, financials, trends, operations, calendar,
  } = admin.data;

  // Prepare data for Nivo charts
  const revenueChartData = [
    {
      id: 'Revenue',
      data: financials.revenueByMonth.map((item) => ({
        x: item._id,
        y: item.total,
      })),
    },
  ];

  const userDistributionData = [
    {
      id: 'Students',
      label: 'Students',
      value: summary.totalStudents,
      color: pieColors[0],
    },
    {
      id: 'Instructors',
      label: 'Instructors',
      value: summary.totalInstructors,
      color: pieColors[1],
    },
  ];

  const registrationData = trends.newRegistrations.map((item) => ({
    role: item._id,
    count: item.count,
  }));

  const ticketStatsData = operations.ticketStats.map((item) => ({
    status: item._id,
    count: item.count,
  }));

  const mostEnrolledCoursesData = trends.mostEnrolledCourses.slice(0, 5).map((item) => ({
    course: item.title,
    students: item.totalStudents,
  }));

  const mostViewedBlogPostsData = trends.mostViewedBlogPosts.slice(0, 5).map((item) => ({
    post: item.title,
    views: item.meta.views,
  }));

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground custom-scrollbar font-body">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-primary/20 pb-4">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-display text-primary tracking-tighter">
            Admin Dashboard
          </h1>
          <p className="text-custom mt-2 text-lg">
            Comprehensive overview of platform analytics and operations.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 md:mt-0 flex items-center"
        >
          <label htmlFor="period-select" className="mr-2 text-sm text-custom font-medium hidden sm:block">
            View Period:
          </label>
          <select
            id="period-select"
            value={period}
            onChange={handlePeriodChange}
            className="p-3 border-2 border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </motion.div>
      </header>

      {/* Summary Section */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <StatCard
          title="Total Students"
          value={summary.totalStudents}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Instructors"
          value={summary.totalInstructors}
          icon={FaUserTie}
          color="purple"
        />
        <StatCard
          title="Total Courses"
          value={summary.totalCourses}
          icon={Book}
          color="blue"
        />
        <StatCard
          title="Total Sales"
          value={`$${(financials.currentPeriod?.totalSales || 0).toLocaleString()}`}
          icon={DollarSign}
          color="teal"
          trend="up"
          trendValue={12.5}
        />
        <StatCard
          title="New Blogs"
          value={summary.totalBlogPosts}
          icon={FileText}
          color="yellow"
        />
        <StatCard
          title="Total Ads"
          value={summary.totalAds}
          icon={MdOutlineLocalOffer}
          color="pink"
        />
        <StatCard
          title="Total Tickets"
          value={summary.totalSupportTickets}
          icon={FaTicketAlt}
          color="red"
        />
        <StatCard
          title="Avg. Resolution"
          value={`${operations.averageResolutionTime} days`}
          icon={BiTimer}
          color="indigo"
          trend="down"
          trendValue={3.1}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financials & User Distribution Section */}
        <div className="lg:col-span-2">
          <DashboardSection title="Analytics Overview" icon={BarChart2}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-popover rounded-xl p-4 shadow-sm border border-border h-80 flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-custom">Revenue Trend</h3>
                <div className="flex-1">
                  <NivoLineChart data={revenueChartData} />
                </div>
              </div>
              <div className="bg-popover rounded-xl p-4 shadow-sm border border-border h-80 flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-custom">User Distribution</h3>
                <div className="flex-1">
                  <NivoPieChart data={userDistributionData} />
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* Top Courses & Blogs */}
          <DashboardSection title="Content Performance" icon={Book}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-popover rounded-xl p-4 shadow-sm border border-border h-96">
                <h3 className="text-lg font-bold mb-4 text-custom">Most Enrolled Courses</h3>
                <NivoBarChart
                  data={mostEnrolledCoursesData}
                  keys={['students']}
                  indexBy="course"
                />
              </div>
              <div className="bg-popover rounded-xl p-4 shadow-sm border border-border h-96">
                <h3 className="text-lg font-bold mb-4 text-custom">Most Viewed Blog Posts</h3>
                <NivoBarChart
                  data={mostViewedBlogPostsData}
                  keys={['views']}
                  indexBy="post"
                />
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Recent Activity */}
          <DashboardSection title="Recent Activity" icon={Clock} className="flex-1">
            <ul className="space-y-3 custom-scrollbar overflow-y-auto max-h-[400px]">
              {calendar.upcomingEvents.map((event) => (
                <li
                  key={event._id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-popover/50 border border-primary/20 rounded-lg shadow-sm hover:bg-popover transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 mr-3 text-accent-foreground animate-bell-ring" />
                    <span className="font-semibold text-foreground">{event.title}</span>
                  </div>
                  <div className="text-sm text-custom mt-2 md:mt-0">
                    <span className="md:mr-4">{new Date(event.startTime).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </DashboardSection>

          {/* Support & Operations */}
          <DashboardSection title="Operations Status" icon={FaTicketAlt} className="flex-1">
            <div className="h-64 mb-4">
              <h3 className="text-lg font-bold mb-2 text-custom">Ticket Status Breakdown</h3>
              <NivoPieChart
                data={ticketStatsData.map((item) => ({
                  id: item.status,
                  label: item.status,
                  value: item.count,
                }))}
              />
            </div>
            <div className="bg-secondary rounded-lg p-4 mt-4">
              <h4 className="text-base font-semibold text-foreground">Recent Inquiries</h4>
              <ul className="space-y-2 mt-2 custom-scrollbar overflow-y-auto max-h-40">
                {operations.recentContacts.map((contact) => (
                  <li
                    key={contact._id}
                    className="flex justify-between items-center p-2 bg-background rounded-md"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-sm text-foreground">{contact.name}</span>
                      <p className="text-xs text-custom truncate">{contact.subject}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary uppercase">
                      {contact.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </DashboardSection>
        </div>
      </div>

      {/* Marketing Section */}
      <DashboardSection title="Marketing & Coupons" icon={MdOutlineLocalOffer}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-popover rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-lg font-bold mb-4 text-custom">Ad Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg border border-border">
                <span>Total Clicks</span>
                <span className="font-bold text-lg text-primary">{operations.adPerformance?.totalClicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg border border-border">
                <span>Total Impressions</span>
                <span className="font-bold text-lg text-primary">{operations.adPerformance?.totalImpressions.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-popover rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-lg font-bold mb-4 text-custom">Top 3 Coupons</h3>
            <ul className="space-y-3">
              {financials.topCoupons.map((coupon) => (
                <li
                  key={coupon.code}
                  className="flex justify-between items-center p-4 bg-secondary rounded-lg border border-border"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">{coupon.title}</span>
                    <span className="text-sm text-custom">{coupon.code}</span>
                  </div>
                  <span className="text-sm text-custom">Uses: {coupon.uses}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
};

export default AdminAnalysis;