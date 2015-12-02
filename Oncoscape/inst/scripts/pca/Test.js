//16:04
// pca/Test.js
//------------------------------------------------------------------------------------------------------------------------
var pcaTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var pcaStatusObserver = null;
    var testStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#pcaStatusDiv";
    var majorStatusDiv = "#pcaTestStatusDiv";

    

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html


//------------------------------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{
     // run through <reps> repetitions of the test
     // condition the next test upon the completion of the preceeding one,
     // which is detected by a change to the majorStatusDiv
     // minorStatusDiv is used to gate successive tests applied -within-
     // a dataset
     
      
   console.log("===================================== Test.pca: runTests");
   console.log("Test.pca: runTests: " + JSON.stringify(datasetNames));
   console.log("reps: " + reps);
   console.log("exitOnCompletion: " + exitOnCompletion);
   
   
   var datasetIndex = -1;

   var config = {attributes: true, childList: true, characterData: true};
   var target =  document.querySelector(majorStatusDiv);

      // define a function to be called whenever the testStatusDiv changes,
      // which is our signal that the next test is ready to run.
      // the first test is kicked off when we -- after setting up and
      // configuring the observer -- manually (see below: "start testing")
      // change the target which the observer watches.
      // there may be a better way, but for now we delete and recreate
      // the observer at the end of each test.
      // note also that the next dataset is determined inside this function
      // and that the function refers to itself.

   var onMutation = function(mutations){
      mutation = mutations[0];
      testStatusObserver.disconnect();
      testStatusObserver = null;
      var id = mutation.target.id;
      var msg = $(majorStatusDiv).text();
      console.log("test status changed, text: " + msg);
      datasetIndex++;
      if(datasetIndex < (datasetNames.length * reps)){
         console.log("about to test dataset " + datasetNames[datasetIndex]);      
         testStatusObserver = new MutationObserver(onMutation);
         testStatusObserver.observe(target, config);
         if(datasetIndex < (datasetNames.length * reps))
            testLoadDatasetPCA(datasetNames[datasetIndex % datasetNames.length]);
         }
      else{
         console.log("mutation observer function detected end of datasets");
         if(exitOnCompletion){
            var payload = {errorCount: Object.keys(sessionStorage).length,
                           errors: JSON.stringify(sessionStorage)};
            var exitMsg = {cmd: "exitAfterTesting", callback: "", status: "request", payload: payload};
            console.log("about to send exitAfterTesting msg to server");
            hub.send(JSON.stringify(exitMsg));
            } // if exitOnCompletion
         } // else: datasets exhaused
      };

   testStatusObserver = new MutationObserver(onMutation);
   testStatusObserver.observe(target, config);

   $(majorStatusDiv).text("start testing");

} // runTests
//------------------------------------------------------------------------------------------------------------------------
function testLoadDatasetPCA(dataSetName)
{
   var testTitle = "testLoadDatasetPCA";
   console.log(testTitle);
  
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("pcaDiv");
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#pcaStatusDiv").text();
        QUnit.test('choose dataset for pca: '+ dataSetName, function(assert) {
          hub.raiseTab("datasetsDiv");
          $("#datasetMenu").val(dataSetName);
          $("#datasetMenu").trigger("change");
          assert.equal($("#datasetMenu").val(), dataSetName);
          //var datasetsManifestTableLength = $("#datasetsManifestTable tr").length;
          //console.log("*****datasetsManifestTableLength is: ",datasetsManifestTableLength);
          //assert.equal(datasetsManifestTableLength, 18);
          //assert.ok(datasetsManifestTableLength > 9);
          //assert.equal($("#datasetsManifestTable tbody tr").eq(0).find("td").eq(0).text(), 
          //            "mRNA expression");
         hub.raiseTab("pcaDiv");
         testCalculate(dataSetName);
         //test datasetMenu dropdown menu value;
        });
      }); // new MutationObserver
    } // if null mutation observer
    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};
   console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   hub.send(JSON.stringify(msg));

} // testLoadDataset
//----------------------------------------------------------------------------------------------------
function testCalculate(dataSetName)
{
   hub.raiseTab("pcaDiv");
   console.log("starting testCalculate");
   var genesetIndex = -1;
   
    if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("pcaDiv");
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#pcaStatusDiv").text();
        // enable the calculate button, change its color, then click
        genesetIndex++;
        if(genesetIndex < document.getElementById("pcaGeneSetSelector").length){
          QUnit.test('testPcaCalculate', function(assert) {
          $("#pcaCalculateButton").prop("disabled", false);
          $("#pcaCalculateButton").css({"background-color": "red", "color": "green"});
          //$("#pcaGeneSetSelector").val("random.24");
          document.getElementById("pcaGeneSetSelector").selectedIndex = genesetIndex;
          $("#pcaGeneSetSelector").trigger("change");
          console.log("*****pcaGeneSetSelector current value is: ", $("#pcaGeneSetSelector").val());
          // check if the "Calculate" is clicked
          assert.equal($("#pcaCalculateButton").css('color'), "rgb(0, 128, 0)");
          // tests (assertions) in next function, testContentsOfPcaPlot
          //$("#pcaCalculateButton").click();
          console.log("*****within testCalculate payload : ", msg.payload);
          testContentsOfPcaPlot();
          //markEndOfTestingDataSet();
          });
        }  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   var msg = {cmd: "requestDataTableMeta", callback: "", status: "request", payload:  dataSetName};
   console.log("about to send requestDataTableMeta msg to server: " + dataSetName);
   hub.send(JSON.stringify(msg));

} // testCalculate
//----------------------------------------------------------------------------------------------------
function testContentsOfPcaPlot()
{
   console.log("--- testContentsOfPcaPlot");
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        
        console.log("***** withint testContents payload : ", msg.payload);
           QUnit.test('testPcaContents', function(assert) { 
              assert.ok($("circle").length > 120);
              var c0 = $("circle")[0];
              var xPos = Number(c0.getAttribute("cx"));
              var yPos =  Number(c0.getAttribute("cy"));
              var radius = Number(c0.getAttribute("r"));
              console.log(xPos + "  " + yPos + "  " + radius);
              assert.ok(xPos > 0);
              assert.ok(yPos > 0);
              assert.equal(radius, 3);
              markEndOfTestingDataSet();
              //testSendGoodIDs(); 
            });
      }); // new MutationObserver
    } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   //var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};
   //console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   //hub.send(JSON.stringify(msg));

} // testContentsOfPcaPlot
//----------------------------------------------------------------------------------------------------
function testSendGoodIDs()
{
   console.log("entering Test.pac:testSendGoodIDs");

   var title = "testSendIDs";
   console.log(title);

      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.67                                                           
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs

   
   // selection of incoming identifiers can be a bit promiscuous.  for instance,
   // sending "Y" will select "Y" and "YWHAE"
   var currentGeneSet = $("#pcaGeneSetSelector").val();
   //var selectedPatientIdentifiers = msg.payload.value;
   var currentIdentifiers = requestSampleNames().splice(0,9);
   
   console.log('currentGeneSet: ', currentGeneSet, 'and currentIdentifiers: ', currentIdentifiers);
          
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testSendIDs " + 10 + "  statusMsg: " + statusMsg);
           var selectedNodes = currentPatientIDs;
           assert.ok(selectedNodes.length === 10, "incoming 10 nodes, selected: " +
                     selectedNodes.length);
           markEndOfTestingDataSet();     
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   console.log("testSendIDs, sending " + JSON.stringify(ids));
   var payload = {samples: currentPatientIDs, genes: currentGeneSet, source: "pca/Test.js::testSendIDs"};
   msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
   hub.send(JSON.stringify(msg));

} // testSendGoodIDs
//------------------------------------------------------------------------------------------------------------------------
function markEndOfTestingDataSet()
{
  console.log("end of testing dataset");
  $(majorStatusDiv).text("dataset complete");
  $("#testManagerLoopStatusDiv").text("Test.pca, datasets complete");
  
} // markEndOfTestingDataSet
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing pca/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // pcaTestModule
pcaTester = pcaTestModule();
moduleTests.push(pcaTester);
