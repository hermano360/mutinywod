var CronJob = require('cron').CronJob,
    fs      = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
MongoClient = require('mongodb').MongoClient,
     assert = require('assert'),
 twilioText = require('./twiliotext.js'),
 	contacts = require('./numbers.js');


     require('dotenv').load();

var job = new CronJob('55 29 5 * * 1-5', updateWOD, null,true,'America/Los_Angeles');


function updateWOD(){
		var url = "http://www.mutinycrossfit.com/wod";
		dateCollector(url,function(datesOnWebpage){
			var justDates = dateExtractor(datesOnWebpage);
			var dbLink = 'mongodb://'+process.env.MLAB_USER+':'+process.env.MLAB_PW+'@'+process.env.MLAB_DB;
				MongoClient.connect(dbLink, function(err, db) {
					db.collection('wods').find({date:{"$in": justDates}}).toArray(function(err, docs) {
						assert.equal(err, null);
						var insertDocuments = compareDocsDates(docs,datesOnWebpage);
						if(insertDocuments.length > 0){
							db.collection('wods').insertMany(insertDocuments,function(err,res){
								assert.equal(err,null);
								console.log("DB updated with "+insertDocuments.length+" new documents");
								sendMorningText(datesOnWebpage);
								db.close();
							});
						} else {
							console.log("DB already up to date!");
							sendMorningText(datesOnWebpage);
							db.close();
						}
					});	
				});
		});

		// production, will remove this and will change it only to its scheduled time.
		//job.stop();
}

function sendMorningText(wodsOnline){
	var today = new Date();
	wodsOnline.forEach(function(wod){
		if((today - new Date(wod.date))<86400000){
			contacts().forEach(function(contact){
				twilioText.sendText(process.env.TWILIO_SID,process.env.TWILIO_AUTHTOKEN,process.env.TWILIO_FROM_NUM,contact.number,wod.crossfit);
			})
		}
	});
}


function compareDocsDates(dbWODS, webWODS){
	var insertDocuments = [];
	var insertDoc;
	webWODS.forEach(function(webWod){
		insertDoc = false;
		dbWODS.forEach(function(dbWod){
			if(dbWod.date===webWod.date){
				insertDoc = true;
			}
		});
		if(!insertDoc){
			insertDocuments.push(webWod);
		}
	});

	return insertDocuments;
}

function dateExtractor(wodArray){
	var datesArray= [];
	wodArray.forEach(function(wod){
		datesArray.push(wod.date);
	});
	return datesArray;
}

function dateCollector(url,cb) {
	var wodArray = [];
	request(url,function(error,response,html){
		if(!error){
			var $ = cheerio.load(html);
			var dbentry;
			var WODDate;
			var individualExercise;
			for(var i = 1; i <= 14; i++){
				dbentry = {};
				WODDate = "";
				individualExercise = "";

				$("li.post"+i+" div.postContent h2.postTitle a").filter(function(){
					WODDate = $(this).text().replace(/^.+\s(\d+)-(\d+)-(\d+)/,"$1-$2-$3");
					dbentry.date = WODDate;
				});

				WOD = $("li.post"+i+" div.postBody strong");
				individualExercise = WOD.toString();
        		//Run the Regex analysis to extract out the workout, removing all of the
        		//unnecessary elements
        		dbentry.crossfit =  individualExercise.replace(/(<strong>)*CROSSFIT((<\/strong>)*|(<\/span>))*/g,"").replace(/<strong>/,"").replace(/(<strong>HIT-CON.*)/g,"").replace(/(<strong>)|(<p>)/g," ").replace(/<(\/strong>)|(<\/span>)/g,":").replace(/<br>/g,",").replace(/(&#x.*?;\s*)|(<span.*?\">)|(<\/p>)/g,"").replace(/(:$)|(^[\s\.:,])/g,"").replace(/(:,)|(::)/g,": ").replace(/(:\s,)/g,": ").replace(/&amp;/g,"&");
				wodArray.push(dbentry);
			}
		}
		cb(wodArray);
	});
}





