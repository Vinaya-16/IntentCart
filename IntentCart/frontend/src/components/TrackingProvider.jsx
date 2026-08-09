import React, { useEffect } from 'react';
import eventTracker from '../utils/eventTracker';

const TrackingProvider = ({ children }) => {
    useEffect(() => {
        // Track user login
        const handleStorageChange = (e) => {
            if (e.key === 'user') {
                const user = JSON.parse(e.newValue);
                if (user) {
                    eventTracker.trackEvent({
                        eventType: 'user_login',
                        metadata: {
                            userId: user._id,
                            email: user.email
                        }
                    });
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            eventTracker.flushEvents();
        };
    }, []);

    return children;
};

export default TrackingProvider;