const axios = require('axios');
const fs = require("fs");

let csvHeader = 'Name,CostMin,CostMax,Link,Latitude,Longitude\n';

function fetchRentList(zoneId) {

  let data = JSON.stringify({
    query: `query listings($ListingSearchConsumerAttributes: ListingSearchConsumerAttributes, $locale: LocaleType, $order: SortingListingSearchConsumerAttributes, $page: Int, $perPage: Int) {
  listings(
    ListingSearchConsumerAttributes: $ListingSearchConsumerAttributes
    locale: $locale
    order: $order
    page: $page
    perPage: $perPage
  ) {
    status
    result {
      id
      coverPicture
      slug
      name
      title
      location { lat lng}
      road
      houseNumber
      street
      province
      district
      subdistrict
      sponsorPackage
      hasVirtualTour
      distance
      addressDocument {
        reviewStatus
              }
      addressPhoto {
        reviewStatus
              }
      price {
        monthly {
          minPrice
          maxPrice
          type
                  }
        daily {
          minPrice
          maxPrice
          type
                  }
              }
      promotion {
        type
        start
        end
        detail
              }
      modifiedAt
      refreshedAt
      updatedAt
      createdAt
          }
    pagination {
      page
      perPage
      totalCount
      totalPages
          }
    error {
      message
          }
      }
}`,
    variables: {
      "ListingSearchConsumerAttributes": {"zoneId": zoneId, "rentalType": "MONTHLY"},
      "locale": "th",
      "page": 1,
      "perPage": 200
    }
  });

  let config = {
    method: 'post',
    url: 'https://graphql.renthub.in.th/',
    headers: {
      'content-type': 'application/json'
    },
    data: data
  };

  return axios(config);
}


function fetchZones() {
  let data = JSON.stringify({
    query: `query zones($name: String, $zoneType: [ZoneTypeItem!], $zoneSubType: [ZoneSubTypeItem!], $provinceCode: Int, $zoneId: [ID!], $locale: LocaleType, $page: Int, $perPage: Int) {
  zones(
    ZoneSearchConsumerAttributes: {name: $name, zoneType: $zoneType, zoneId: $zoneId, zoneSubType: $zoneSubType, provinceCode: $provinceCode}
    page: $page
    perPage: $perPage
    locale: $locale
  ) {
    status
    result {
      id
      name
      zoneType
      zoneSubType
      zoneInformation
      listingCount {
        monthly
        daily
              }
      slug
          }
    error {
      message
          }
      }
}`,
    variables: {
      "zoneType": "MASS_TRANSIT",
      "locale": "th",
      "perPage": 10000
    }
  });

  let config = {
    method: 'post',
    url: 'https://graphql.renthub.in.th/',
    headers: {
      'content-type': 'application/json',
    },
    data: data
  };

  return axios(config);
}


async function parse() {
  const now = new Date();
  const runDate = now.getFullYear() + '-' + ("00" + (now.getMonth() + 1)).slice(-2) + '-' + now.getDate();
  const resZones = await fetchZones();
  let zones = resZones.data.data.zones.result;
  for (const zone of zones) {
    let fileName = `output/${zone.name}-${runDate}.csv`
    fs.appendFile(fileName, csvHeader, function (err) {
      if (err) return console.log(err);
    });
    const resRents = await fetchRentList(zone.id);
    const rents = resRents.data.data.listings.result;
    for (const rent of rents) {
      let stationContent = `"${rent.name}","${rent.price.monthly.minPrice}","${rent.price.monthly.maxPrice}","https://www.renthub.in.th/${rent.id}",${rent.location.lat},${rent.location.lng}\n`;
      fs.appendFile(fileName, stationContent, function (err) {
        if (err) return console.log(err);
      });
    }
  }
}

parse().then()
