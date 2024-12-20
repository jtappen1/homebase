"use client";
import styles from "./page.module.css";
import GoogleMapComponent from "./components/homebase/map";
import SearchBar from "./components/homebase/search";
import NavBar from "./components/homebase/navbar";
import ActivitySelector from "./components/homebase/activitySelector";
import Homebase from "./components/homebase/homebase";
import { useEffect, useRef, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ActivityGroup, Place } from "@/lib/utils";
import DailyActivities from "./components/homebase/dailyActivities";
import RouteOptimization from "./components/homebase/routeOptimization";
import { format } from "date-fns";

export default function Home() {
  const [homebaseLocation, setHomebaseLocation] = useState<Place | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activityGroups, setActivityGroups] = useState<ActivityGroup[]>([]);

  const today = new Date()
  const [dates, setDates] = useState<Date[]>([today]);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [dailyPlans, setDailyPlans] = useState<Record<string, Place[]>>({});

 
  const addToDailyPlan = async (activity: Place) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, "PPP");
      if (!dailyPlans[dateKey]?.some((a) => a.placeId === activity.placeId)) {
        setDailyPlans({
          ...dailyPlans,
          [dateKey]: [...(dailyPlans[dateKey] || []), activity],
        });
        const userId = localStorage.getItem('userId')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/place/daily-plan`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            place_id: activity.placeId,
            daily_plan_id: dateKey,
          }),
        });
      
        if (!response.ok) {
          throw new Error("Failed to add place to daily plan");
        }
        console.log(response.json());
      }
    }
  };

  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<{id: string, index: number}| null>({id:"RANDID", index:20});
  const [focusHomebase, setFocusHomebase] = useState(false);
  const [focusSelectedLocation, setFocusSelectedLocation] = useState<Place | undefined>();

  const prevHomebaseLocation = useRef(homebaseLocation);
  const prevSelectedPlace = useRef(selectedPlace);
  const prevSelectedActivity = useRef(selectedActivity);

  useEffect(() => {
    if (localStorage.getItem('homebasePositionLng') && localStorage.getItem('homebasePositionLat')) {
      const name = localStorage?.getItem('homebaseName');
      const location = localStorage.getItem('homebaseLocation');
      const placeId = localStorage?.getItem('homebaseID');
      const lat = parseFloat(localStorage?.getItem('homebasePositionLat')!);
      const lng = parseFloat(localStorage?.getItem('homebasePositionLng')!);
      const viewportStr = localStorage?.getItem('homebaseViewport')!
      const viewportObj = JSON.parse(viewportStr)
      const place = new Place(name!, location!, placeId!, lat, lng, viewportObj)
      setHomebaseLocation(place)
    }
  }, []);

  useEffect(() => {
    if (homebaseLocation !== prevHomebaseLocation.current) {
      setFocusSelectedLocation(homebaseLocation!);
    } else if (selectedPlace !== prevSelectedPlace.current) {
      setFocusSelectedLocation(selectedPlace!);
    }
    else if (selectedActivity !== prevSelectedActivity.current) {
      const selectedGroup = activityGroups.find((group) => group.id === selectedActivity?.id);

      const activity = selectedGroup?.activities.at(selectedActivity?.index!)
      if (activity) {
        setFocusSelectedLocation(activity);
        setSelectedActivity({id: "PAGE_ID", index:20});
      }
    }
    else if (focusHomebase) {
      setFocusSelectedLocation(homebaseLocation!)
      setFocusHomebase(false);
    }
    // Update refs to current values for next comparison
    prevHomebaseLocation.current = homebaseLocation;
    prevSelectedPlace.current = selectedPlace;
    prevSelectedActivity.current = selectedActivity;
  }), [homebaseLocation, selectedPlace, selectedActivity, focusHomebase]

  return (
    <div className="bg-white">
      <NavBar />
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <div className= "main">
          <main className={styles.main}>
            <div className="container">
              <header className="header">
                <Homebase
                  homebaseLocation={homebaseLocation}
                  setFocusHomebase={setFocusHomebase}
                  onHomebaseSelect={setHomebaseLocation}
                />
                <SearchBar onPlaceSelect={setSelectedPlace} />
              </header>

              <aside className="sidebar">
                <ActivitySelector
                  activityGroups={activityGroups}
                  setActivityGroups={setActivityGroups}
                  addToDailyPlan={(activity) =>
                    addToDailyPlan(activity)
                  }
                  // Example for Day 1
                  openGroup={openGroups}
                  setOpenGroup={setOpenGroups}
                  setSelectedActivity={setSelectedActivity}
                />
              </aside>

              <section className="map">
                <GoogleMapComponent
                  selectedPlace={selectedPlace}
                  homebaseLocation={homebaseLocation}
                  openGroup={openGroups}
                  activityGroups={activityGroups}
                  focusSelectedLocation={focusSelectedLocation}
                  setActivityGroups={setActivityGroups}
                  setSelectedActivity={setSelectedActivity}
                />
              </section>

              <section className="schedule flex">
                  <div className="flex-1">
                    <DailyActivities
                      dailyPlans={dailyPlans}
                      setDailyPlans={setDailyPlans}
                      activityGroups={activityGroups}
                      dates={dates}
                      setDates={setDates}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      today={today}
                    />
                  </div>
                  <div className=" schedule-optimization flex-2">
                    <RouteOptimization/>
                  </div>
              </section>
            </div>
            
          </main>
        </div>
      </APIProvider>
      <footer className="w-full bg-black text-white text-center py-1">
        <p className="text-sm">
          Homebase &copy; 2024
        </p>
      </footer>
    </div>
    
  );
}
