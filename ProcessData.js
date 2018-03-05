

var DataProcessing = {

    costMeasure: "dollar",

    getCostVarianceMetric: function(row){
        if(DataProcessing.costMeasure === "dollar"){
            return row["Cost Variance ($ M)"]
        }
        return row["Schedule Variance (in days)"]
    },

    getCostMainMetric: function(row){
        if(DataProcessing.costMeasure === "dollar"){
            return row["Projected/Actual Cost ($ M)"];
        } else {
            var completion = row["Completion Date (B1)"].split("/");
            var start = row["Start Date"].split("/");
            if(completion.length === 0 || start.length === 0){
                return "";
            }
            var startDate = new Date(parseInt(start[2]), parseInt(start[1])-1, parseInt(start[0])),
                completionDate = new Date(parseInt(completion[2]), parseInt(completion[1])-1, parseInt(completion[0]));

            console.log(Math.round((completionDate-startDate)/(1000*60*60*24)));
            return Math.round((completionDate-startDate)/(1000*60*60*24));
        }
    },

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

        var departmentTotals = {};

        console.log(DataProcessing.costMeasure);
        for(var i = 0; i < data.length; i++){
            if(DataProcessing.getCostVarianceMetric(data[i]) !== "" &&
                DataProcessing.getCostMainMetric(data[i]) !== "" &&
                !isNaN(DataProcessing.getCostVarianceMetric(data[i])) &&
                !isNaN(DataProcessing.getCostMainMetric(data[i]))) {

                var obj = {
                    name: data[i]["Agency Name"],
                    label: data[i]["Agency Name"].split(" ").map(function (d) {
                        return d.charAt(0)
                    }).join(""),
                    variance: parseFloat(DataProcessing.getCostVarianceMetric(data[i])),
                    value: parseFloat(DataProcessing.getCostMainMetric(data[i]))
                };
                console.log(obj);


                if (departmentTotals[data[i]["Agency Code"]] !== undefined) {
                    departmentTotals[data[i]["Agency Code"]].push(obj);
                } else {
                    departmentTotals[data[i]["Agency Code"]] = [obj];
                }
            }
        }

        var toReturn = [];

        for(key in departmentTotals) {
            if(key !== "") {

                if (!departmentTotals.hasOwnProperty(key)) continue;

                var arr = departmentTotals[key];
                var varianceAvg = 0, valueAvg = 0;

                for (var j = 0; j < arr.length; j++) {
                    varianceAvg += arr[j].variance;
                    valueAvg += arr[j].value;
                }
                toReturn.push({
                        name: arr[1].name,
                        label: arr[1].name.split(" ").map(function (d) {
                            return d.charAt(0)
                        }).join(""),
                        variance: DataProcessing.calcVariance(varianceAvg / arr.length),
                        agency: key,
                        value: valueAvg / arr.length,
                        x: Math.random() * 900,
                        y: Math.random() * 800
                    }
                );
            }
        }

        console.log(toReturn);
        cb(toReturn);
    },

    switchCostMetric: function(err, data, cb, id){
        DataProcessing.costMeasure = id;
        DataProcessing.resetData(err, data, cb);
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