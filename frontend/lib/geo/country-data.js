import { Country, State } from "country-state-city";

let countryOptionsCache = null;
let dialCodeOptionsCache = null;

function digitsOnly(value) {
  return String(value || "").replace(/[^\d]/gu, "");
}

export function getCountryOptions() {
  if (!countryOptionsCache) {
    countryOptionsCache = Country.getAllCountries()
      .map((country) => ({
        value: country.isoCode,
        label: country.name,
        dialCode: `+${digitsOnly(country.phonecode)}`,
      }))
      .filter((option) => option.value && option.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return countryOptionsCache;
}

export function getDialCodeOptions() {
  if (!dialCodeOptionsCache) {
    dialCodeOptionsCache = Country.getAllCountries()
      .map((country) => {
        const dialCode = `+${digitsOnly(country.phonecode)}`;
        return {
          value: country.isoCode,
          label: `${country.flag ? `${country.flag} ` : ""}${country.name} (${dialCode})`,
          dialCode,
        };
      })
      .filter((option) => option.value && option.dialCode !== "+")
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return dialCodeOptionsCache;
}

export function getStatesForCountry(isoCode) {
  if (!isoCode) {
    return [];
  }

  return State.getStatesOfCountry(isoCode).map((state) => ({
    value: state.isoCode,
    label: state.name,
  }));
}
