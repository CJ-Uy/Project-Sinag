"use client";

import { useState } from "react";
import {
	APIProvider,
	Map as GoogleMap,
	type MapCameraChangedEvent,
	ControlPosition,
} from "@vis.gl/react-google-maps";

interface MapProps {
	onCenterChange?: (center: { lat: number; lng: number }) => void;
}

export default function SelectLocation({
	onCenterChange = () => {},
}: MapProps) {
	const [mapCenter, setMapCenter] = useState({ lat: 14.641, lng: 121.1 });

	const handleCameraChange = (ev: MapCameraChangedEvent) => {
		const newCenter = {
			lat: ev.detail.center.lat,
			lng: ev.detail.center.lng,
		};
		setMapCenter(newCenter);
		onCenterChange(newCenter);
		console.log("Map center changed to:", newCenter);
	};

	return (
		<div className="w-[100vw] h-[90vh] bg-offBlack">
			<APIProvider
				apiKey={process.env.NEXT_PUBLIC_GOOGLE_API}
				libraries={["marker"]}
				onLoad={() => console.log("Maps API has loaded.")}
			>
				<GoogleMap
					mapId={process.env.NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID_RETRO || process.env.NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID}
					defaultZoom={13}
					defaultCenter={{ lat: 14.641, lng: 121.1 }}
					onCameraChanged={handleCameraChange}
					streetViewControl={false}
					scaleControl={false}
					rotateControl={false}
					cameraControl={false}
					fullscreenControlOptions={{ position: ControlPosition.RIGHT_BOTTOM }}
					mapTypeControlOptions={{ position: ControlPosition.LEFT_BOTTOM }}
				/>
			</APIProvider>
		</div>
	);
}
