import { useEffect, useState } from 'react';
import styles from './Announcement.module.css';

interface AnnouncementProps {
  message: string;
  onComplete: () => void;
  duration?: number;
}

export const Announcement = ({ message, onComplete, duration = 1500 }: AnnouncementProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className={`${styles.announcement} ${!isVisible ? styles.fadeOut : ''}`}>
      <div className={styles.message}>
        {message}
      </div>
    </div>
  );
};
