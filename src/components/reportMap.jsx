"use client";

import { useEffect, useState, useRef } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  ControlPosition,
} from "@vis.gl/react-google-maps";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModeratorStore } from "@/zustand/store";

const HideScrollbarStyles = () => (
  <style jsx global>{`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

export default function ReportMap({ apiKey, mapId }) {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const isLoggedIn = useModeratorStore((state) => state.isLoggedIn);

  useEffect(() => {
    try {
      (async () => {
        let response;

        if (isLoggedIn) {
          response = await fetch("/api/report/all");
        } else {
          response = await fetch("/api/report/public");
        }

        const data = await response.json();
        setAllReports(data);
        setLoading(false);
      })();
    } catch (error) {
      console.error("There was an error in loading the reports", error);
    }
  }, [isLoggedIn, reloadTrigger]);

  async function hideReport(id) {
    const response = await fetch("/api/report/hide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Add this
      },
      body: JSON.stringify({ id: id }),
    });

    setReloadTrigger((prev) => prev + 1);
    setIsDrawerOpen(false);
  }

  async function unhideReport(id) {
    const response = await fetch("/api/report/unhide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Add this
      },
      body: JSON.stringify({ id: id }),
    });

    setReloadTrigger((prev) => prev + 1);
    setIsDrawerOpen(false);
  }

  const handleMarkerClick = async (report) => {
    try {
      const response = await fetch("/api/report/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: report.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report details");
      }

      const detailedReport = await response.json();
      setSelectedReport(detailedReport);
      setIsDrawerOpen(true);
    } catch (error) {
      console.error("Error fetching report details:", error);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <APIProvider
        apiKey={apiKey}
        libraries={["marker"]}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <GoogleMap
          mapId={mapId}
          defaultZoom={13}
          defaultCenter={{ lat: 14.641, lng: 121.1 }}
          onCameraChanged={(ev) =>
            console.log(
              "camera changed:",
              ev.detail.center,
              "zoom:",
              ev.detail.zoom
            )
          }
          streetViewControl={false}
          scaleControl={false}
          rotateControl={false}
          cameraControl={false}
          fullscreenControlOptions={{ position: ControlPosition.RIGHT_BOTTOM }}
          mapTypeControlOptions={{ position: ControlPosition.LEFT_BOTTOM }}
        />

        {loading ? (
          <h1>LOADING ... </h1>
        ) : (
          allReports.map((report) => (
            <AdvancedMarker
              key={report.id}
              position={{ lat: report.lat, lng: report.lon }}
              onClick={() => handleMarkerClick(report)}
            >
              <div className="relative">
                <div className="absolute">
                  <div className="w-[15px] h-[15px] bg-offBlack rounded-full border-[3px] border-accentYellow shadow-[11px_9px_29px_8px_rgba(0,_0,_0,_0.35)]" />
                </div>

                <div
                  className="absolute"
                  style={{ transform: "translate(calc(-50% + 7.5px), -100%)" }}
                >
                  <div className="custom-marker">
                    <img
                      src={report.imageUrl[0]}
                      alt="Loading..."
                      width={100}
                      height={75}
                      className="rounded-[30px] border-[3px] border-accentYellow"
                    />
                  </div>

                  <div className="w-[5px] h-[5px] bg-accentYellow mx-auto" />
                </div>
              </div>
            </AdvancedMarker>
          ))
        )}
      </APIProvider>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent side="bottom" className="h-[85vh]">
          <DrawerHeader>
            <div className="img relative">
              {isLoggedIn ? (
                selectedReport?.hidden ? (
                  <Button
                    onClick={() => unhideReport(selectedReport.id)}
                    className="rounded-full absolute z-20 right-[-12px] top-[-12px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      className="text-green-800"
                    >
                      <title>As Moderator Unhide Report</title>
                      <path
                        fill="currentColor"
                        d="M6 23H3q-.825 0-1.412-.587T1 21v-3h2v3h3zm12 0v-2h3v-3h2v3q0 .825-.587 1.413T21 23zm-6-4.5q-3 0-5.437-1.775T3 12q1.125-2.95 3.563-4.725T12 5.5t5.438 1.775T21 12q-1.125 2.95-3.562 4.725T12 18.5m0-3q1.45 0 2.475-1.025T15.5 12t-1.025-2.475T12 8.5T9.525 9.525T8.5 12t1.025 2.475T12 15.5m0-2q-.625 0-1.062-.437T10.5 12t.438-1.062T12 10.5t1.063.438T13.5 12t-.437 1.063T12 13.5M1 6V3q0-.825.588-1.412T3 1h3v2H3v3zm20 0V3h-3V1h3q.825 0 1.413.588T23 3v3z"
                      />
                    </svg>
                  </Button>
                ) : (
                  <Button
                    onClick={() => hideReport(selectedReport.id)}
                    className="rounded-full absolute z-20 right-[-12px] top-[-12px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 36 36"
                      className="text-red-500 min-h-[25px] min-w-[25px]"
                    >
                      <title>As Moderator Hide Report</title>
                      <path
                        fill="currentColor"
                        d="M18.37 11.17a6.8 6.8 0 0 0-2.37.43l8.8 8.8a6.8 6.8 0 0 0 .43-2.4a6.86 6.86 0 0 0-6.86-6.83"
                        className="clr-i-solid clr-i-solid-path-1"
                      />
                      <path
                        fill="currentColor"
                        d="M34.29 17.53c-3.37-6.23-9.28-10-15.82-10a16.8 16.8 0 0 0-5.24.85L14.84 10a14.8 14.8 0 0 1 3.63-.47c5.63 0 10.75 3.14 13.8 8.43a17.8 17.8 0 0 1-4.37 5.1l1.42 1.42a19.9 19.9 0 0 0 5-6l.26-.48Z"
                        className="clr-i-solid clr-i-solid-path-2"
                      />
                      <path
                        fill="currentColor"
                        d="m4.87 5.78l4.46 4.46a19.5 19.5 0 0 0-6.69 7.29l-.26.47l.26.48c3.37 6.23 9.28 10 15.82 10a16.9 16.9 0 0 0 7.37-1.69l5 5l1.75-1.5l-26-26Zm8.3 8.3a6.85 6.85 0 0 0 9.55 9.55l1.6 1.6a14.9 14.9 0 0 1-5.86 1.2c-5.63 0-10.75-3.14-13.8-8.43a17.3 17.3 0 0 1 6.12-6.3Z"
                        className="clr-i-solid clr-i-solid-path-3"
                      />
                      <path fill="none" d="M0 0h36v36H0z" />
                    </svg>
                  </Button>
                )
              ) : (
                <div />
              )}
            </div>

            {!selectedReport ? (
              <div className="p-4 text-center">Loading...</div>
            ) : selectedReport?.imageUrl?.length > 0 ? (
              <div className="relative group">
                <div
                  ref={scrollContainerRef}
                  className="w-full h-64 overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
                >
                  <div className="flex h-full pl-4 pr-16 gap-4">
                    {selectedReport.imageUrl.map((url, index) => (
                      <div
                        key={index}
                        className="flex-none w-7/8 h-full snap-start"
                      >
                        <img
                          src={url}
                          alt={`Report image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => scroll("left")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No images available
              </div>
            )}
            <DrawerTitle className="flex text-center justify-center items-center">
              <div className="w-[85vw]">
                {selectedReport?.location || "Location not available"}
              </div>
            </DrawerTitle>
            <DrawerDescription asChild>
              <div className="text-sm text-muted-foreground flex text-left justify-center items-center w-[85vw] mx-auto">
                {selectedReport?.description || "No description available"}
              </div>
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>

      <HideScrollbarStyles />
    </>
  );
}
