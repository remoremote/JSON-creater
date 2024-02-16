const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const TurndownService = require("turndown");
const turndownService = new TurndownService();
const mySecret = process.env["googleAPIKey"];

const baseUrl = "https://casaframe.ch";
const overviewPath = "/de/publisher/S1eULf6tOHWAIeKpRsca2ozbdZJuhj3A/";
const maxPageNumber = 8; // Assuming the last page is 8 as per your input

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url);
    return cheerio.load(data);
  } catch (error) {
    console.error(`Error fetching the HTML for URL: ${url}`, error);
    return null;
  }
}

async function scrapePage(link) {
  const $ = await fetchHTML(link);
  if (!$) return null;

  const details = {};

  // Scrape address details
  const addressLink = $(
    ".btn.config-bg-primary.form-control.config-border-radius.contact-map-link",
  ).attr("href");
  if (addressLink) {
    // Extract address components from the Google Maps link
    const addressComponents = await getAddressFromGoogleMaps(addressLink);
    details.address = addressComponents;
  }

  // Scrape title
  details.metaTitle = $(".offer-title").text().trim(); // metaTitle is replacing title

  // Scrape description
  details.descriptionHTML = $(".descriptions").html(); // Store HTML description
  details.descriptionMarkdown = turndownService.turndown(
    details.descriptionHTML,
  ); // Convert HTML to Markdown
  details.descriptionMarkdown = `### ${details.metaTitle}\n\n${details.descriptionMarkdown}`; // Adding title to description

  // Scrape property information
  $(".property-info tr").each((i, elem) => {
    const key = $(elem).find("th").text().trim();
    let value = $(elem).find("td").text().trim();

    // Adjusting key names and values
    switch (key) {
      case "zip":
        details.totalArea = value; // Changing key name
        break;
      case "Referenz":
        details.systemOfficeId = value; // Changing key name
        break;
      case "Verfügbar ab":
        details.dateRent = value; // Changing key name
        break;
      case "Etage":
        details.stockwerk = parseInt(value) || 0; // Changing key name and parsing value to number
        break;
      case "Nettomiete":
        details.price = parsePrice(value); // Changing key name and parsing value to number
        break;
      case "Bruttomiete":
        details.monthlyPrice = parsePrice(value); // Changing key name and parsing value to number
        break;
      case "Nutzfläche":
        details.totalArea = parseArea(value); // Changing key name and parsing value to number
        break;
      case "Raumhöhe":
      case "Mietkaution":
        // Ignore these keys
        break;
      case "Kategorie":
        details.spaceType = parseSpaceType(value); // Changing key name
        break;
      default:
        details[key] = value;
        break;
    }
  });

  // If price, Nettomiete, or Bruttomiete keys don't exist, set price to 0
  if (!details.price && !details.monthlyPrice) {
    details.price = 0;
  }

  // Scrape images
  const imageCount = $(".image-count.slider-label").text().trim();
  const images = await scrapeImages(link, imageCount);

  details.images = images;

  return details;
}

async function scrapeImages(link, imageCount) {
  const images = [];

  try {
    const { data } = await axios.get(link);
    const $ = cheerio.load(data);

    // Parse the background-image CSS property to extract the image URLs
    $(".responsive-image").each((index, element) => {
      const backgroundImage = $(element).attr("style");
      const imageUrl = backgroundImage.match(/url\('([^']+)'\)/)[1];
      images.push(imageUrl);
    });
  } catch (error) {
    console.error("Error scraping images:", error);
  }

  return images;
}

async function getAddressFromGoogleMaps(addressLink) {
  try {
    const latLngMatch = addressLink.match(/daddr=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (latLngMatch && latLngMatch.length === 3) {
      const latitude = latLngMatch[1];
      const longitude = latLngMatch[2];
      const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleAPIKey}`;
      const reverseGeocodeResponse = await axios.get(reverseGeocodeUrl);
      console.log("Reverse Geocoding Response:", reverseGeocodeResponse.data); // Log the response
      const { results } = reverseGeocodeResponse.data;
      if (results && results.length > 0) {
        const addressComponents = results[0].address_components;
        const address = {};
        // Extract address components
        addressComponents.forEach((component) => {
          const types = component.types;
          types.forEach((type) => {
            switch (type) {
              case "street_number":
                address.number = component.long_name;
                break;
              case "route":
                address.street = component.long_name;
                break;
              case "postal_code":
                address.zip = component.long_name;
                break;
              case "locality":
                address.city = component.long_name;
                break;
              // Add more cases as needed
            }
          });
        });
        return address;
      }
    }
  } catch (error) {
    console.error("Error extracting address from Google Maps:", error);
  }
  return null;
}

async function scrapeOverviewPage(pageNumber) {
  const pageUrl = `${baseUrl}${overviewPath}?page=${pageNumber}`;
  const $ = await fetchHTML(pageUrl);
  if (!$) return [];

  const links = [];
  $(".offer-item").each((i, elem) => {
    const link = $(elem).attr("href");
    if (link) {
      links.push(baseUrl + link);
    }
  });

  return links;
}

async function saveToJson(data, filename) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filename}`);
  } catch (error) {
    console.error("Error saving data to JSON file:", error);
  }
}

function parsePrice(value) {
  const match = value.match(/(\d+)’?(\d*)/); // Adjusted regex to capture numbers with or without the character "’"
  return match ? parseInt(match[1] + match[2]) : 0;
}

function parseArea(value) {
  const match = value.match(/(\d+)’?(\d*)/); // Adjusted regex to capture numbers with or without the character "’"
  return match ? parseInt(match[1] + match[2]) : 0;
}

function parseSpaceType(value) {
  switch (value) {
    case "Einzelhandel":
      return "Commercial Space";
    case "Büro":
      return "Office Space";
    case "Ladenfläche":
      return "Retail Space";
    case "Lager":
      return "Commercial Space";
    default:
      return value;
  }
}

async function main() {
  let allDetails = [];

  for (let i = 1; i <= maxPageNumber; i++) {
    const pageLinks = await scrapeOverviewPage(i);
    for (const link of pageLinks) {
      const details = await scrapePage(link);
      if (details) {
        allDetails.push(details);
      }
    }
  }

  // Filter out objects with the key "Kaufpreis"
  allDetails = allDetails.filter((detail) => !("Kaufpreis" in detail));

  console.log("Collected Details:", allDetails);
  // Here you can save or process the collected details
  // For example, save to a JSON file
  saveToJson(allDetails, "details.json");
}

main();
