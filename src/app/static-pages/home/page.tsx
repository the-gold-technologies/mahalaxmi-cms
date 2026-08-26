"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { HeroSliderSection } from "./components/HeroSliderSection";
import { AboutSection } from "./components/AboutSection";
import { ProductsServicesSection } from "./components/ProductsServicesSection";
import { TrustedClientsSection } from "./components/TrustedClientsSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { DistributorBannerSection } from "./components/DistributorBannerSection";
import { LocateDistributorSection } from "./components/LocateDistributorSection";

export default function HomePageEditor() {
  const [homeData, setHomeData] = useState<any>(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const res = await fetch("/api/home");
        const json = await res.json();
        if (json.success && json.data) {
          setHomeData(json.data);
        }
      } catch (err) {
        console.error("Failed to load home sections:", err);
      }
    }
    loadHomeData();
  }, []);

  return (
    <section className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Home Page Content"
        description="Manage the layout sections of your homepage. Expand any section to edit its details."
      />

      <HeroSliderSection initialData={homeData?.HeroSlider} />
      <AboutSection initialData={homeData?.AboutSection} />
      <ProductsServicesSection
        initialData={homeData?.ProductsServicesSection}
      />
      <TrustedClientsSection initialData={homeData?.TrustedClientsSection} />
      <TestimonialsSection initialData={homeData?.TestimonialsSection} />
      <DistributorBannerSection initialData={homeData?.DistributorBanner} />
      <LocateDistributorSection
        initialData={homeData?.LocateDistributorSection}
      />
    </section>
  );
}
