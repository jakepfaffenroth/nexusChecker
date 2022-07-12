require("dotenv").config();
const axios = require("axios");

(async () => {
  const openings = await getOpenings();
  let { that, thor } = openings;
  const { shouldNotify, text } = checkDates(openings);
  if (shouldNotify) {
    notify(text);
  }
})();

async function getOpenings() {
  const blaine = 5020;
  // const mn = 5160;

  try {
    const response = await axios({
      method: "GET",
      url: "https://ttp.cbp.dhs.gov/schedulerapi/slots",
      params: {
        orderBy: "soonest",
        limit: "1",
        locationId: blaine,
        minimum: "1",
      },
    });

    const openings = response.data;
    return openings;
  } catch (err) {
    console.log("err:", err);
  }
}

function checkDates(openings) {
  let text;
  const now = new Date(Date.now());
  const isEvenDay = now.getDate() % 2 == 0;
  const is8am = now.getHours() == 8 && now.getMinutes() == 0;

  if (openings.length) {
    openings.forEach((slot) => {
      const date = new Date(slot.startTimestamp);

      const goodMonth = /7|8|9|10|11/i.test(date.getMonth() + 1);
      const goodDay = /0|3|6/i.test(date.getDay()); // Sun, Wed, Sat
      const isBetter = goodMonth && goodDay;

      if (isBetter) {
        text =
          text ||
          `NEXUS OPENING!
      `;
        text += date.toLocaleString();
      }
    });
  } else if (isEvenDay && is8am) {
    text = "(no openings)";
  } else {
    text = "";
  }

  return { shouldNotify: !!text, text };
}

async function notify(text) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
  const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console
  const client = require("twilio")(accountSid, authToken, {
    lazyLoading: true,
  });

  const phones = [
    process.env.PHONE_1,
    //  process.env.PHONE_2
  ];
  phones.forEach((phone) => {
    client.messages
      .create({
        to: phone,
        from: process.env.FROM_PHONE,
        body: text,
      })
      .then((message) => console.log(message.sid))
      .done();
  });
}
