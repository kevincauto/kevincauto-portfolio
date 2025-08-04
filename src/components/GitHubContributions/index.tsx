'use client';

import React, { useEffect, useState } from 'react';
import ActivityCalendar, { Activity } from 'react-activity-calendar';
import styles from './GitHubContributions.module.css';

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

const GitHubContributions = () => {
  const [data, setData] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalContributions, setTotalContributions] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/github-contributions');
        if (!res.ok) {
          throw new Error('Failed to fetch contribution data');
        }
        const calendar: ContributionCalendar = await res.json();
        
        setTotalContributions(calendar.totalContributions);

        const activities: Activity[] = calendar.weeks.flatMap((week: ContributionWeek) =>
          week.contributionDays.map((day: ContributionDay) => ({
            date: day.date,
            count: day.contributionCount,
            level: Math.min(day.contributionCount, 4),
          }))
        );

        setData(activities);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading contribution data...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{totalContributions} GitHub contributions in the last year</h2>
      <div className={styles.calendarWrapper}>
        <ActivityCalendar
          data={data}
          theme={{
              light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
              dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
          }}
          labels={{
              totalCount: '{{count}} contributions in the last year',
          }}
          showWeekdayLabels
        />
      </div>
    </div>
  );
};

export default GitHubContributions; 