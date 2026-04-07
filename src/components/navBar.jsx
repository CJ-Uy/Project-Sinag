"use client";
import React from "react";
import { useRouter } from "next/navigation";
import ModLogin from "@/components/modLogin";
import { useHotlineGUI } from "@/zustand/store"

export default function NavBar() {
  const router = useRouter();

  const setVisible = useHotlineGUI(state => state.setVisible);

  return (
    <div className="flex mt-auto overflow-hidden">
      <div className="relative flex w-full h-[10vh] bg-[#003744] justify-center items-center gap-8 sm:gap-16">
        <div
          onClick={() => {
            router.push("/");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-white w-8 h-8 m-2"
            viewBox="0 0 24 24"
          >
            <title>Home</title>
            <path
              fill="currentColor"
              d="M6 19h3v-6h6v6h3v-9l-6-4.5L6 10zm-2 2V9l8-6l8 6v12h-7v-6h-2v6zm8-8.75"
            />
          </svg>
        </div>

        {/* TODO: Make connect this to he hotlines dialog opening */}
        <div>
          <svg
            onClick={() => setVisible(true)}
            xmlns="http://www.w3.org/2000/svg"
            className="text-white w-8 h-8 m-5"
            viewBox="0 0 24 24"
          >
            <title>Hotlines</title>
            <path
              fill="currentColor"
              d="M19.95 21q-3.125 0-6.187-1.35T8.2 15.8t-3.85-5.55T3 4.05V3h5.9l.925 5.025l-2.85 2.875q.55.975 1.225 1.85t1.45 1.625q.725.725 1.588 1.388T13.1 17l2.9-2.9l5 1.025V21zM6.025 9l1.65-1.65L7.25 5H5.025q.125 1.125.375 2.113T6.025 9m8.95 8.95q1 .425 2.013.675T19 18.95v-2.2l-2.35-.475zm0 0"
            />
          </svg>
        </div>

        <div
          onClick={() => {
            router.push("/feed");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-white w-8 h-8 m-5"
            viewBox="0 0 24 24"
          >
            <title>Feed</title>
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 10c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14z" />
              <path d="M6 12c0-1.414 0-2.121.44-2.56C6.878 9 7.585 9 9 9h6c1.414 0 2.121 0 2.56.44c.44.439.44 1.146.44 2.56v4c0 1.414 0 2.121-.44 2.56c-.439.44-1.146.44-2.56.44H9c-1.414 0-2.121 0-2.56-.44C6 18.122 6 17.415 6 16z" />
              <path strokeLinecap="round" d="M7 6h5" />
            </g>
          </svg>
        </div>

        {/* TODO: Add Heat map thing */}
        <div>
          <ModLogin />
        </div>
      </div>
    </div>
  );
}
