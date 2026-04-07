"use client";

import ReportMap from "@/components/reportMap";
import NavBar from "@/components/navBar";
import AddButton from "@/components/addButton";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import Hotline from "@/components/hotline";
import { useHotlineGUI } from "@/zustand/store";
import { Dialog } from "@/components/ui/dialog";

export default function MapPage({ apiKey, mapId }) {
  const isVisible = useHotlineGUI((state) => state.isVisible);
  const setVisible = useHotlineGUI((state) => state.setVisible);

  return (
    <>
      <Dialog open={isVisible} onOpenChange={setVisible}>
        <Hotline />
      </Dialog>
      <div className="relative w-full h-[90vh] bg-offBlack">
        <div className="absolute z-30 w-full h-[6vh] bg-[#003744]">
          <div className="flex h-[100%] w-[90%] mx-auto justify-center items-center gap-2">
            <Label className="text-3xl text-neutral-50">Sinag</Label>
            <Image
              src="/projectSinag_logo.png"
              alt="logo"
              width="32"
              height="32"
              className="w-auto h-[80%]"
            />
          </div>
        </div>
        <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[1vh] translate-y-3/4">
          <AddButton />
        </div>
        <ReportMap apiKey={apiKey} mapId={mapId} className="h-[90vh] z-10" />
        <NavBar className="h-[10vh]" />
      </div>
    </>
  );
}
