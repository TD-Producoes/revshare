"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Search } from "lucide-react";

export type MarketerFilterState = {
  search: string;
  specialties: string[];
  earningsRanges: string[];
  locations: string[];
  focusAreas: string[];
};

type MarketersFiltersProps = {
  filters: MarketerFilterState;
  onFiltersChange: (filters: MarketerFilterState) => void;
  availableSpecialties: string[];
  availableLocations: string[];
  availableFocusAreas: string[];
};

const EARNINGS_RANGES = [
  { value: "0-1000", label: "$0 - $1,000" },
  { value: "1000-5000", label: "$1,000 - $5,000" },
  { value: "5000-10000", label: "$5,000 - $10,000" },
  { value: "10000-50000", label: "$10,000 - $50,000" },
  { value: "50000-100000", label: "$50,000 - $100,000" },
  { value: "100000+", label: "$100,000+" },
];

export function MarketersFilters({
  filters,
  onFiltersChange,
  availableSpecialties,
  availableLocations,
  availableFocusAreas,
}: MarketersFiltersProps) {
  const [specialtiesOpen, setSpecialtiesOpen] = useState(true);
  const [earningsOpen, setEarningsOpen] = useState(true);
  const [locationsOpen, setLocationsOpen] = useState(true);
  const [focusAreasOpen, setFocusAreasOpen] = useState(true);

  const updateFilter = <K extends keyof MarketerFilterState>(
    key: K,
    value: MarketerFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = filters.specialties.includes(specialty)
      ? filters.specialties.filter((s) => s !== specialty)
      : [...filters.specialties, specialty];
    updateFilter("specialties", newSpecialties);
  };

  const toggleEarningsRange = (range: string) => {
    const newRanges = filters.earningsRanges.includes(range)
      ? filters.earningsRanges.filter((r) => r !== range)
      : [...filters.earningsRanges, range];
    updateFilter("earningsRanges", newRanges);
  };

  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter((l) => l !== location)
      : [...filters.locations, location];
    updateFilter("locations", newLocations);
  };

  const toggleFocusArea = (focusArea: string) => {
    const newFocusAreas = filters.focusAreas.includes(focusArea)
      ? filters.focusAreas.filter((f) => f !== focusArea)
      : [...filters.focusAreas, focusArea];
    updateFilter("focusAreas", newFocusAreas);
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.specialties.length > 0 ||
    filters.earningsRanges.length > 0 ||
    filters.locations.length > 0 ||
    filters.focusAreas.length > 0;

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      specialties: [],
      earningsRanges: [],
      locations: [],
      focusAreas: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search marketers..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">FILTER BY:</Label>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Specialties Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setSpecialtiesOpen(!specialtiesOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Specialties</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              specialtiesOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {specialtiesOpen && (
          <div className="space-y-2 pt-2">
            {availableSpecialties.map((specialty) => (
              <div key={specialty} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialty-${specialty}`}
                  checked={filters.specialties.includes(specialty)}
                  onCheckedChange={() => toggleSpecialty(specialty)}
                />
                <Label
                  htmlFor={`specialty-${specialty}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {specialty}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings Range Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setEarningsOpen(!earningsOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Earnings Range</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              earningsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {earningsOpen && (
          <div className="space-y-2 pt-2">
            {EARNINGS_RANGES.map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`earnings-${range.value}`}
                  checked={filters.earningsRanges.includes(range.value)}
                  onCheckedChange={() => toggleEarningsRange(range.value)}
                />
                <Label
                  htmlFor={`earnings-${range.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locations Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setLocationsOpen(!locationsOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Location</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              locationsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {locationsOpen && (
          <div className="space-y-2 pt-2">
            {availableLocations.map((location) => (
              <div key={location} className="flex items-center space-x-2">
                <Checkbox
                  id={`location-${location}`}
                  checked={filters.locations.includes(location)}
                  onCheckedChange={() => toggleLocation(location)}
                />
                <Label
                  htmlFor={`location-${location}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {location}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Focus Areas Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setFocusAreasOpen(!focusAreasOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Focus Area</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              focusAreasOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {focusAreasOpen && (
          <div className="space-y-2 pt-2">
            {availableFocusAreas.map((focusArea) => (
              <div key={focusArea} className="flex items-center space-x-2">
                <Checkbox
                  id={`focus-${focusArea}`}
                  checked={filters.focusAreas.includes(focusArea)}
                  onCheckedChange={() => toggleFocusArea(focusArea)}
                />
                <Label
                  htmlFor={`focus-${focusArea}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {focusArea}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

