"use client";

import React from "react";
import { usePageSections, SectionsLoadState } from "@/components/SectionsLoader";
import { PageHeader } from "@/components/PageHeader";
import { HeroSliderSection } from "./components/HeroSliderSection";
import { AboutSection } from "./components/AboutSection";
import { ProductsServicesSection } from "./components/ProductsServicesSection";
import { TrustedClientsSection } from "./components/TrustedClientsSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { LocateDistributorSection } from "./components/LocateDistributorSection";

export default function HomePageEditor() {
  const { data: homeData, status, reload } = usePageSections("/api/home");

  return (
    <section className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Home Page Content"
        description="Manage the layout sections of your homepage. Expand any section to edit its details."
      />

      <SectionsLoadState status={status} onRetry={reload} />
      {status === "ready" && (
        <>
          <HeroSliderSection initialData={homeData?.HeroSlider} />
          <AboutSection initialData={homeData?.AboutSection} />
          <ProductsServicesSection initialData={homeData?.ProductsServicesSection} />
          <TrustedClientsSection initialData={homeData?.TrustedClientsSection} />
          <TestimonialsSection initialData={homeData?.TestimonialsSection} />
          <LocateDistributorSection initialData={homeData?.LocateDistributorSection} />
        </>
      )}
    </section>
  );
}
