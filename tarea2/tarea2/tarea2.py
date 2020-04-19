import csv
import math
import json


def getBand(value):
    return math.floor(value)


def hasProperty(container, key):
    return (key in container) and container[key] != "" and container[key] is not None


def storeCountry(result, country, years):
    bands = result["bands"]
    print(f"Current country {country}\n")
    for year in country["years"]:
        print(f"Current year: {year}\n")
        current_year = country["years"][year]

        if (
            not hasProperty(current_year, "fertility")
            or not hasProperty(current_year, "life_expectancy")
            or not hasProperty(current_year, "female_population")
        ):
            continue

        band = getBand(current_year["fertility"])

        # Initialize a band
        if band not in bands:
            active_band = bands[band] = dict()
            band_years = active_band["years"] = dict()
            for index_year in years:
                active_year = band_years[years[index_year]] = dict()
                active_year["total_population"] = 0
                active_year["weighted_average_fertility"] = 0.0
                active_year["weighted_average_expectancy"] = 0.0
                active_year["countries"] = dict()

        current_band = bands[band]
        current_band_year = current_band["years"][year]
        countries = current_band_year["countries"]
        countries[country["code"]] = {
            "code": country["code"],
            "name": country["name"],
            "fertility": current_year["fertility"],
            "life_expectancy": current_year["life_expectancy"],
            "female_population": current_year["female_population"],
        }

        current_band_year["total_population"] = current_band_year["total_population"] + \
            current_year["female_population"]


def addValues(country, data, years, key, convert):
    current_years = country["years"]
    for year_index in years:
        current_val = data[year_index]
        if current_val != "" and current_val is not None:
            year = current_years[years[year_index]]
            year[key] = convert(current_val)


def includePostProcessingData(result):
    print("Starting post processing...\n")
    bands = result["bands"]
    for band in bands:
        print(f"Start post-processing for band: {band}")
        current_band = bands[band]
        years = current_band["years"]
        for year in years:
            print(f"Start post-processing for band: {band}, year: {year}")
            current_year = years[year]
            current_year["weighted_average_fertility"] = 0.0
            current_year["weighted_average_expectancy"] = 0.0
            countries = current_year["countries"]
            for country in countries:
                print(
                    f"Start post-processing for band: {band}, year: {year}, country: {country}")
                current_country = countries[country]
                current_year["weighted_average_expectancy"] = current_year["weighted_average_expectancy"] + (
                    current_country["life_expectancy"] * current_country["female_population"])
                current_year["weighted_average_fertility"] = current_year["weighted_average_fertility"] + (
                    current_country["fertility"] * current_country["female_population"])

            # Set totals
            if current_year["total_population"] == 0:
                print(
                    f"No weighted values set for band: {band}, year: {year} with total population: {current_year['total_population']}")
                continue

            print(
                f"Calculating weighted values for band: {band}, year: {year} with total population: {current_year['total_population']}")
            current_year["weighted_average_fertility"] = current_year["weighted_average_fertility"] / \
                current_year["total_population"]
            current_year["weighted_average_expectancy"] = current_year["weighted_average_expectancy"] / \
                current_year["total_population"]


def getDataFromCSVFile(file_path):
    result = dict()
    result["bands"] = dict()
    years = dict()

    with open(file_path) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=",")
        line_count = 0
        current_country = {"name": "", "code": ""}
        for row in csv_reader:
            # Extract the list of years from the column names
            if line_count == 0:
                for col_index in range(4, len(row) - 1):
                    years[col_index] = row[col_index]
                line_count += 1
                continue

            current_country_code = row[1]

            # Save/Initialize if we change country
            if current_country["code"] != current_country_code:
                if current_country["code"] != "":
                    storeCountry(result, current_country, years)
                # Initialize object
                current_country = {"name": row[0],
                                   "code": current_country_code}

                current_years = current_country["years"] = dict()
                for year_index in years:
                    current_years[years[year_index]] = dict()
                    print(
                        "Adding year {years[year_index]} to country {current_country['code']}"
                    )

            # Extract fertility rate
            if row[3] == "SP.DYN.TFRT.IN":
                addValues(current_country, row, years, "fertility", float)

            # Extract fertility rate
            if row[3] == "SP.DYN.LE00.FE.IN":
                addValues(current_country, row, years,
                          "life_expectancy", float)

            # Extract Female Population
            if row[3] == "SP.POP.TOTL.FE.IN":
                addValues(current_country, row, years,
                          "female_population", int)

            # Process each data row
            line_count += 1

        # Store last Country record
        storeCountry(result, current_country, years)

    result["years"] = list(years.values())

    # Include totals
    includePostProcessingData(result)

    return result


def writeDataToFile(file_path, data):
    with open(file_path, 'w') as outfile:
        json.dump(data, outfile, indent=2)
