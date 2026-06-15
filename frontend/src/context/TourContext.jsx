import React, { createContext, useContext, useState, useCallback } from 'react';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);

  const startTour = useCallback(() => setIsTourActive(true), []);
  const endTour = useCallback(() => setIsTourActive(false), []);

  return (
    <TourContext.Provider value={{ isTourActive, startTour, endTour }}>
      {children}
    </TourContext.Provider>
  );
};
