"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Search } from "lucide-react";

export type FilterState = {
  search: string;
  categories: string[];
  revenueRanges: string[];
  commissionRanges: string[];
  countries: string[];
};

type ProjectsFiltersProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories: string[];
  availableCountries: string[];
};

const REVENUE_RANGES = [
  { value: "0-1000", label: "$0 - $1,000" },
  { value: "1000-5000", label: "$1,000 - $5,000" },
  { value: "5000-10000", label: "$5,000 - $10,000" },
  { value: "10000-50000", label: "$10,000 - $50,000" },
  { value: "50000-100000", label: "$50,000 - $100,000" },
  { value: "100000+", label: "$100,000+" },
];

const COMMISSION_RANGES = [
  { value: "0-10", label: "0% - 10%" },
  { value: "10-15", label: "10% - 15%" },
  { value: "15-20", label: "15% - 20%" },
  { value: "20-25", label: "20% - 25%" },
  { value: "25-30", label: "25% - 30%" },
  { value: "30+", label: "30%+" },
];

export function ProjectsFilters({
  filters,
  onFiltersChange,
  availableCategories,
  availableCountries,
}: ProjectsFiltersProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [revenueOpen, setRevenueOpen] = useState(true);
  const [commissionOpen, setCommissionOpen] = useState(true);
  const [countriesOpen, setCountriesOpen] = useState(true);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    updateFilter("categories", newCategories);
  };

  const toggleRevenueRange = (range: string) => {
    const newRanges = filters.revenueRanges.includes(range)
      ? filters.revenueRanges.filter((r) => r !== range)
      : [...filters.revenueRanges, range];
    updateFilter("revenueRanges", newRanges);
  };

  const toggleCommissionRange = (range: string) => {
    const newRanges = filters.commissionRanges.includes(range)
      ? filters.commissionRanges.filter((r) => r !== range)
      : [...filters.commissionRanges, range];
    updateFilter("commissionRanges", newRanges);
  };

  const toggleCountry = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    updateFilter("countries", newCountries);
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.categories.length > 0 ||
    filters.revenueRanges.length > 0 ||
    filters.commissionRanges.length > 0 ||
    filters.countries.length > 0;

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      categories: [],
      revenueRanges: [],
      commissionRanges: [],
      countries: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
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

      {/* Categories Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Category</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              categoriesOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {categoriesOpen && (
          <div className="space-y-2 pt-2">
            {availableCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Range Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setRevenueOpen(!revenueOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Revenue Range</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              revenueOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {revenueOpen && (
          <div className="space-y-2 pt-2">
            {REVENUE_RANGES.map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`revenue-${range.value}`}
                  checked={filters.revenueRanges.includes(range.value)}
                  onCheckedChange={() => toggleRevenueRange(range.value)}
                />
                <Label
                  htmlFor={`revenue-${range.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission Range Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setCommissionOpen(!commissionOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Commission Range</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              commissionOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {commissionOpen && (
          <div className="space-y-2 pt-2">
            {COMMISSION_RANGES.map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`commission-${range.value}`}
                  checked={filters.commissionRanges.includes(range.value)}
                  onCheckedChange={() => toggleCommissionRange(range.value)}
                />
                <Label
                  htmlFor={`commission-${range.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Countries Filter */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setCountriesOpen(!countriesOpen)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          <span>Country</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              countriesOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {countriesOpen && (
          <div className="space-y-2 pt-2">
            {availableCountries.map((country) => (
              <div key={country} className="flex items-center space-x-2">
                <Checkbox
                  id={`country-${country}`}
                  checked={filters.countries.includes(country)}
                  onCheckedChange={() => toggleCountry(country)}
                />
                <Label
                  htmlFor={`country-${country}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {country}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

