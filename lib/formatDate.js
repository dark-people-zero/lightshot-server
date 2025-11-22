const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// Format: DD-MM-YYYY H:i:s dengan zona waktu Jakarta (UTC+7)
function formatToJakarta(date) {
  return dayjs(date)
    .tz("Asia/Jakarta")
    .format("DD-MM-YYYY HH:mm:ss");
}

module.exports = { formatToJakarta };
