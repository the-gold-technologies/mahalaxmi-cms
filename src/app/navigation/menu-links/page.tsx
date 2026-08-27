"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface NavLinkItem {
  id?: string;
  label: string;
  url: string;
  type: string;
  parent?: string;
  order?: number;
  title?: string;
  isStatic?: boolean;
}

const DEFAULT_DISPLAY_LINKS: NavLinkItem[] = [
  {
    label: "Home",
    url: "/",
    type: "Main Link",
    isStatic: true,
  },
  {
    label: "About Us",
    url: "/about-us",
    type: "Main Link",
    isStatic: true,
  },
  {
    label: "Products & Services",
    url: "/products",
    type: "Main Link",
    isStatic: true,
  },
  {
    label: "Events & Gallery",
    url: "/events",
    type: "Main Link",
    isStatic: true,
  },
  {
    label: "Blogs",
    url: "/blogs",
    type: "Main Link",
    isStatic: true,
  },
  {
    label: "Contact Us",
    url: "/contact-us",
    type: "Main Link",
    isStatic: true,
  },
];

export default function MenuLinksPage() {
  const [links, setLinks] = useState<NavLinkItem[]>(DEFAULT_DISPLAY_LINKS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNavLinks() {
      try {
        const res = await fetch("/api/nav-links");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const seen = new Set<string>();
          const unique = json.data.filter((l: NavLinkItem) => {
            const key = l.label.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setLinks(unique);
        }
      } catch (err) {
        console.error("Failed to load navigation links:", err);
        toast.error("Failed to load navigation links");
      } finally {
        setLoading(false);
      }
    }
    loadNavLinks();
  }, []);

  return (
    <section className="flex flex-col gap-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1528] tracking-tight">
          Navigation Links
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 font-normal">
          Manage the links that appear in the main website navigation bar.
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-2 sm:p-6 lg:p-8">
        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-slate-400">
            Loading navigation structure...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-transparent">
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24 whitespace-nowrap">
                    ORDER
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    LABEL / TITLE
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center w-40 whitespace-nowrap">
                    TYPE
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-56 whitespace-nowrap">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {links.map((link, idx) => {
                  const isDropdown =
                    link.type?.toLowerCase().includes("dropdown") || false;
                  return (
                    <tr
                      key={link.id || idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Order Column */}
                      <td className="py-5 px-6 text-sm font-semibold text-slate-600 whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {/* Label / Title Column */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2.5">
                          {isDropdown && (
                            <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5] shrink-0" />
                          )}
                          <span className="text-sm sm:text-[15px] font-bold text-slate-900 tracking-tight whitespace-nowrap">
                            {link.label}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge Column */}
                      <td className="py-5 px-6 text-center whitespace-nowrap">
                        {isDropdown ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap bg-purple-50 text-purple-600">
                            DROPDOWN
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap bg-blue-50 text-[#002B5C]">
                            MAIN LINK
                          </span>
                        )}
                      </td>

                      {/* URL Column */}
                      <td className="py-5 px-6 font-mono text-sm text-slate-500 font-normal whitespace-nowrap">
                        {link.url}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
