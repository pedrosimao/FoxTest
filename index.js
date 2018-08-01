const
    cheerio = require('cheerio'); // scraping tool
    fs = require('fs'); // file system
    chrono = require('chrono-node'); // date parser
    accounting = require('accounting'); // accounting parser


// prototype JSON object
let output = {
    status: {},
    result: {
        trips:[{
            code: {},
            name: {},
            details: { 
                price: {},
                roundTrips: [],
            }
        }],
        custom: {
            prices: [],
        }
    }
}

// main function of the app
const scrape = url => {

    // regex to clean backspaces before double quotes
    const cleanHtml = url.toString().replace(/\\"+/g, '"');

    //load cheerio
    try {
        const $ = cheerio.load(cleanHtml);

        // start scraping 
        const codeLength = $('td[class="pnr-ref"]').find('span').length - 1; // get the last code in the page
        output.result.trips[0].code = $('td[class="pnr-ref"]').find('span').eq(codeLength).text().trim();
        output.result.trips[0].name = $('.pnr-info').slice(1).eq(0).text().trim();
        output.result.trips[0].details.price = accounting.unformat( $('.very-important').text().trim(), ",");

        $('.product-details').each( i => { 
            output.result.trips[0].details.roundTrips.push({ 
                "type": $('.travel-way').eq(i).text().trim(),
                "date": chrono.fr.parseDate($('.product-travel-date').eq(i).text().trim()),
                "trains": [{
                    "departureTime": $('.origin-destination-hour').not('.origin-destination-border').eq(i).text().trim(),
                    "departureStation": $('.origin-destination-station').not('.origin-destination-border').eq(i).text().trim(),
                    "arrivalTime": $('.origin-destination-hour').filter('.origin-destination-border').eq(i).text().trim(),
                    "arrivalStation": $('.origin-destination-station').filter('.origin-destination-border').eq(i).text().trim(),
                    "type": $('.segment').filter('[width=70]').eq(i).text().trim(),
                    "number": $('.segment').not('[width=70]').eq(i * 2).text().trim(),
                    "passengers":[]

                 }],
             });

            for (let x = 0; x < $('.passengers').eq(i).find('.typology').length; x++){
                let typeAll = $('.passengers').eq(i).find('.fare-details').eq(x).text();
                output.result.trips[0].details.roundTrips[i].trains[0].passengers.push({ 
                    "type": typeAll.match(/\. Billet(.*)/)[0].replace(/ et(.*)/, "").replace(/\. Billet /,""),
                    "age": $('.passengers').eq(i).find('.typology').eq(x).text().replace(/^(.*passager)/, '').trim()
                });

            } 

            let price = $('.cell').filter('[align="right"]').eq(i).text().trim();
            price !== "" ? output.result.custom.prices.push({"value": accounting.unformat(price, ",") } ) : null;
        });
        output.result.custom.prices.push({"value": accounting.unformat($('.amount').text().trim(), ",") } );

        //set status
        output.status = "ok";

    } catch (e) {
        // handle cheerio error
        console.log("CheerIO Error: ", e);
        output.status = "not ok";
    }

    // save to JSON file
    fs.writeFile("./output/test-result.json", JSON.stringify(output,null,2), 'utf8', (err) => {
        if (err) {
            console.log("Error while writing JSON: ", err);
        }
        console.log("The JSON file was saved!");
    }); 
}

scrape(fs.readFileSync('files/test.html'));
