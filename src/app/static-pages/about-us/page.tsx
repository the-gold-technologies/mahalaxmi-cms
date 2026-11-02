"use client";

import React from "react";
import { usePageSections, SectionsLoadState } from "@/components/SectionsLoader";
import { PageHeader } from "@/components/PageHeader";
import {
  AboutHeroSection,
  AboutMahalaxmiContentSection,
  LubesHeadquarterSection,
} from "./components";

export default function AboutUsPageEditor() {
  const { data: aboutData, status, reload } = usePageSections("/api/about-us");

  return (
    <section className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="About Us Page Content"
        description="Manage the live sections of your About Us page including Hero Banner, About Mahalaxmi Enterprises, Why Choose Us cards, and Headquarters info."
      />

      <SectionsLoadState status={status} onRetry={reload} />
      {status === "ready" && (
        <>
          <AboutHeroSection initialData={aboutData?.AboutHero} />
          <AboutMahalaxmiContentSection initialData={aboutData?.AboutMahalaxmiContent} />
          <LubesHeadquarterSection initialData={aboutData?.LubesHeadquarterSection} />
        </>
      )}
    </section>
  );
}
