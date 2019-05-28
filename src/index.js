const { GraphQLServer } = require("graphql-yoga");
const axios = require("axios");
require("dotenv").config();
const busy_hours = require("busy-hours");

const apiKey = process.env.GOOGLE_PLACE_API_KEY;

const getOccupancy = async placeId => {
  const currDate = new Date();
  const currDayIndex = currDate.getDay();
  const currHour = currDate.getHours();

  try {
    const { week } = await busy_hours(placeId, apiKey);
    const { hours } = week.find((el, index) => index === currDayIndex);
    const [{ percentage: occupancy }] = hours.filter(
      ({ hour }) => hour === currHour
    );
    return occupancy;
  } catch (e) {
    console.log(e);
  }
};

const getPlacePhoto = async (photoRef = "") => {
  try {
    const url = `${
      process.env.BASE_PLACE_PHOTO_URL
    }key=${apiKey}&photoreference=${photoRef}&maxwidth=400`;
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    console.log(e);
  }
};

// const testOccupancy = async () => {
//   const currDate = new Date();
//   const currDayIndex = currDate.getDay();
//   const currHour = currDate.getHours();
//   try {
//     const { week } = await busy_hours("ChIJa30FiARdzB0RXsP7a7q9oY0", apiKey);
//     const { hours } = week[currDayIndex];
//     const [{ percentage: occupancy }] = hours.filter(
//         ({ hour }) => hour === currHour
//     );
//     console.log(occupancy);
//   } catch (e) {
//     console.log(e);
//   }
// };

// const testPlace = () => {
//   const searchString = "pubs in newlands, south africa";
//   const placeType = "";
//   const basePlaceTextUrl = process.env.BASE_PLACE_TEXT_SEARCH_URL;
//   const url = `${basePlaceTextUrl}key=${apiKey}&query="${searchString}"
//                 &placeType="${placeType}"`;
//
//   axios
//     .get(url)
//     .then(res => {
//       const {
//         photos: [{ photo_reference }]
//       } = res.data.results[0];
//       console.log(photo_reference);
//       // console.log(res.data.results[0].photos[0].photo_reference);
//     })
//     .catch(e => console.log(e));
// };
//
// testPlace();

const resolvers = {
  Query: {
    places: async (root, { searchString, placeType = "" }) => {
      const basePlaceTextUrl = process.env.BASE_PLACE_TEXT_SEARCH_URL;
      const url = `${basePlaceTextUrl}key=${apiKey}&query="${searchString}"
                &placeType="${placeType}"`;
      try {
        const response = await axios.get(url);
        const { results = [] } = response.data;

        return results.map(
          ({
            place_id: placeId,
            formatted_address: address,
            name: placeName,
            photos: [{ photo_reference }],
            types: placeTypes,
            rating: googleRating,
            opening_hours: { open_now: isOpen }
          }) => ({
            placeId,
            address,
            placeName,
            placeThumbnail: getPlacePhoto(photo_reference),
            placeTypes,
            googleRating,
            isOpen: isOpen,
            currentOccupancy: getOccupancy(placeId),
            currentLikes: 23,
            currentDislikes: 12,
            isFollowingPlace: false
          })
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
};
//
const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers
});
server.start(() => console.log(`Server is running on http://localhost:4000`));
