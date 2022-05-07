
module.exports = {

    // Returns the longest span of consecutive days for which the sleep duration
    // is greater than the number of hours specified.
    sleepHoursStreak(items, hours) {

        let longestStreak = 0
        let currentStreak = 0;

        items.forEach(function (item) {
            if (item.duration > hours * 60 * 60 * 1000) {
                currentStreak += 1;
            } else {
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
                currentStreak = 0;
            }
        });

        return Math.max(longestStreak, currentStreak);
    }
}