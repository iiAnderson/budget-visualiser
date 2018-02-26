

var DataProcessing = {

    calcVariance: function calcVariance(variance){
        if (variance < 0){
            return "Under";
        } else {
            return "Over";
        }
    },

    resetData: function(error, data, cb) {
        if (error) {
            console.log(error);
        }

        var toReturn = [];

        for(var i = 0; i < data.length; i++){

            if(data[i]["Unique Investment Identifier"] === "Total") {
                toReturn.push({
                    name: data[i]["Agency Name"],
                    label: data[i]["Agency Name"].split(" ").map(function(d){return d.charAt(0)}).join(""),
                    variance: DataProcessing.calcVariance(parseFloat(data[i]["Cost Variance (%)"])),
                    agency: data[i]["Agency Code"],
                    value: parseFloat(data[i]["Projected/Actual Cost ($ M)"]),
                    x: Math.random() * 900,
                    y: Math.random() * 800
                });
            }
        }

        cb(toReturn);

    },

    agencyInvestmentData: function(err, data, agency, cb){

        investmentTotals = {};

        var toReturn = [];
        for(var i = 0; i < data.length; i++){
            if(data[i]["Agency Code"] === agency && data[i]["Projected/Actual Cost ($ M)"] !== ""){
                if(investmentTotals[data[i]["Investment Title"]] !== undefined){
                    investmentTotals[data[i]["Investment Title"]].push(
                        {
                            value:parseFloat(data[i]["Projected/Actual Cost ($ M)"]),
                            variance:parseFloat(data[i]["Cost Variance (%)"])
                        });
                } else {
                    investmentTotals[data[i]["Investment Title"]] = [
                        {
                            value:parseFloat(data[i]["Projected/Actual Cost ($ M)"]),
                            variance:parseFloat(data[i]["Cost Variance (%)"]),
                            invId:data[i]["Business Case ID"]
                        }];
                }
            }
        }

        for(key in investmentTotals){

            if (!investmentTotals.hasOwnProperty(key)) continue;

            var arr = investmentTotals[key];
            var valueAvg=0, varianceAvg=0;

            for(var j = 0; j < arr.length; j++){
                valueAvg += arr[j].value;
                varianceAvg += arr[j].variance;
            }

            toReturn.push({
                name: key,
                label: arr[0].invId,
                variance: DataProcessing.calcVariance((varianceAvg/arr.length)),
                agency: agency,
                value: parseFloat((valueAvg/arr.length)),
                x: Math.random() * 900,
                y: Math.random() * 800
            });
        }

        console.log("NEw Data");
        console.log(toReturn);

        cb(toReturn);
    },

    agencyData: function(err, data, agency, investment, cb){
        console.log("PASSED IN " +investment + " " + agency);

        projectTotals = {};

        var toReturn = [];
        for(var i = 0; i < data.length; i++){
            if(data[i]["Agency Code"] === agency && data[i]["Investment Title"] === investment && data[i]["Projected/Actual Cost ($ M)"] !== ""){
                if(projectTotals[data[i]["Project Name"]] !== undefined){
                    projectTotals[data[i]["Project Name"]].push(
                        {
                            value:parseFloat(data[i]["Projected/Actual Cost ($ M)"]),
                            variance:parseFloat(data[i]["Cost Variance (%)"])
                        });
                } else {
                    projectTotals[data[i]["Project Name"]] = [
                        {
                            value:parseFloat(data[i]["Projected/Actual Cost ($ M)"]),
                            variance:parseFloat(data[i]["Cost Variance (%)"]),
                            projId:data[i]["Project ID"]
                        }];
                }
            }
        }

        for(key in projectTotals){

            if (!projectTotals.hasOwnProperty(key)) continue;

            var arr = projectTotals[key];
            var valueAvg=0, varianceAvg=0;

            for(var j = 0; j < arr.length; j++){
                valueAvg += arr[j].value;
                varianceAvg += arr[j].variance;
            }

            toReturn.push({
                name: key,
                label: arr[0].projId,
                variance: DataProcessing.calcVariance((varianceAvg/arr.length)),
                agency: agency,
                value: parseFloat((valueAvg/arr.length)),
                x: Math.random() * 900,
                y: Math.random() * 800
            });
        }

        console.log("Project data");
        console.log(toReturn);

        cb(toReturn);
    }
};