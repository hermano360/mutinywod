var CronJob = require('cron').CronJob,
express = require('express'),
fs      = require('fs'),
request = require('request'),
cheerio = require('cheerio'),
app     = express();

var job = new CronJob(' * * * * * * ', updateWOD, null,true,'America/Los_Angeles');

function updateWOD(){
  var url = 'http://www.mutinycrossfit.com/wod';
  request(url, function(error,response,html){
    if(!error){
      var $ = cheerio.load(html);
      var done = false;
      var individualExercise;
      var selectorForDate,WOD;
      var finalWOD={};
      var WODDate="";
      for(var i = 1; i<=14; i++){
        //resetting the values to do the next iteration
        individualExercise = "";
        WOD={};


        //Identifying the date of the particular WOD
        selectorForDate ="li.post"+i+" div.postContent h2.postTitle a";
        $(selectorForDate).filter(function(){
          var data = $(this);
          WODDate = data.text().replace(/^.+\s(\d+)-(\d+)-(\d+)/,"$1-$2-$3");
          finalWOD[WODDate] = {};
        });

        //Get the entire HTML element that contains the workout
        //and convert it to a string for regex analysis
        WOD = $("li.post"+i+" div.postBody strong");
        individualExercise = WOD.toString();

        //Convert this to promises, this just ensures the program doesn't
        //try creating the final document before completing entire webpage
        if(i==14){
          done = true;
        }

        //Run the Regex analysis to extract out the workout, removing all of the
        //unnecessary elements
        finalWOD[WODDate].crossfit = individualExercise.replace(/(<strong>)*CROSSFIT((<\/strong>)*|(<\/span>))*/g,"").replace(/<strong>/,"").replace(/(<strong>HIT-CON.*)/g,"").replace(/(<strong>)|(<p>)/g," ").replace(/<(\/strong>)|(<\/span>)/g,":").replace(/<br>/g,",").replace(/(&#x.*?;\s*)|(<span.*?\">)|(<\/p>)/g,"").replace(/(:$)|(^[\s\.:,])/g,"").replace(/(:,)|(::)/g,": ").replace(/(:\s,)/g,": ");
      }

    }

    //this is to ensure that the program doesn't try to create the file
    //before it is "done"
    var interval = setInterval(function(){
      if(done === true){

         fs.writeFile('output.txt', JSON.stringify(finalWOD), function(err){

           console.log('Your File Has Been Processed');

         });
        clearInterval(interval);
      }
    }, 1000); 
  });



job.stop();
}


