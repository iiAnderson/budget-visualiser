

var DataProcessing = {

    costMeasure: "dollar",

    getCostMetricText: function(text){
        return DataProcessing.costMeasure === "dollar" ? "$ "+ text +" Million": text +" Days";
    },

    getCostVarianceMetric: function(row){
        if(DataProcessing.costMeasure === "dollar"){
            return row["Cost Variance ($ M)"]
        }
        return row["Schedule Variance (in days)"]
    },

    getCostRadiusFactor: function(){
        if(DataProcessing.costMeasure === "dollar"){
            return 2.5;
        }
        return 1;
    },

    getCostMetricTitle: function(){
        if(DataProcessing.costMeasure === "dollar"){
            return "Cost ($)";
        }
        return "Cost (Work Days)";
    },

    getCostPredictionMetric: function(row){
        if(DataProcessing.costMeasure === "dollar"){
            return row["Planned Cost ($ M)"];
        } else {
            var completion = row["Planned Project Completion Date (B2)"].split("/");
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

    calcVariance: function(variance){
        if (variance > 0){
            return "Over";
        } else {
            return "Under";
        }
    },

    calcColorCategory: function (variance) {
        var adjustedVar = variance*10;
        if (adjustedVar >= 0){
            if(adjustedVar > 2) {
                return 3;
            } else {
                return Math.floor(adjustedVar);
            }
        } else {
            if(adjustedVar < -2){
                return -3;
            } else {
                return Math.ceil(adjustedVar);
            }
        }
    },

    checkKeysForNan: function(obj) {
            for (var key in obj) {
                if (typeof obj[key] === 'number' && isNaN(obj[key])) {
                    return false;
                }
            }
            return true;
    },

    resetData: function(error, data, cb) {
        if (error) {
            console.log(error);
        }

        var departmentTotals = {};

        //Repurposes each row into an object attached to a its corresponding department
        for(var i = 0; i < data.length; i++){
            if(DataProcessing.getCostVarianceMetric(data[i]) !== "" &&
                DataProcessing.getCostMainMetric(data[i]) !== "" &&
                !isNaN(DataProcessing.getCostVarianceMetric(data[i])) &&
                !isNaN(DataProcessing.getCostMainMetric(data[i]))) {

                var obj = {
                    row: i,
                    value: parseFloat(DataProcessing.getCostMainMetric(data[i])),
                    plannedValue: parseFloat(DataProcessing.getCostPredictionMetric(data[i])),
                    name: data[i]["Agency Name"],
                    label: data[i]["Agency Name"].split(" ").map(function (d) {
                        return d.charAt(0)
                    }).join("")
                };


                if(DataProcessing.checkKeysForNan(obj)) {
                    if (departmentTotals[data[i]["Agency Code"]] !== undefined) {
                        departmentTotals[data[i]["Agency Code"]].push(obj);
                    } else {
                        departmentTotals[data[i]["Agency Code"]] = [obj];
                    }
                }
            }
        }

        var toReturn = [];
        var labels = [];

        for(key in departmentTotals) {
            if(key !== "") {

                if (!departmentTotals.hasOwnProperty(key)) continue;

                var arr = departmentTotals[key];
                var varianceAvg = 0, valueAvg = 0, plannedAvg = 0;



                for (var j = 0; j < arr.length; j++) {
                    varianceAvg = varianceAvg + arr[j].variance;
                    valueAvg = valueAvg + arr[j].value;
                    plannedAvg = plannedAvg + arr[j].plannedValue;
                }

                //Handles duplicate labels (case of DoEnergy and DoEducation
                var label = arr[1].name.split(" ").map(function (d) {
                    return d.charAt(0)
                }).join("");

                if(labels.indexOf(label) === -1){
                    labels.push(label);
                } else {
                    label = arr[1].name.split(" ").map(function (d, i) {
                        if(i === (arr[1].name.split.length)){
                            return d.charAt(0) + d.charAt(1);
                        } else {
                            return d.charAt(0);
                        }
                    }).join("")
                }
                toReturn.push({
                        name: arr[1].name,
                        label: label,
                        variance: DataProcessing.calcVariance((valueAvg/plannedAvg)-1),
                        agency: key,
                        value: valueAvg,
                        x: Math.random() * 900,
                        y: Math.random() * 800,
                        colorCategory: DataProcessing.calcColorCategory((valueAvg/plannedAvg)-1),
                        plannedValue: plannedAvg,
                        varianceValue: (valueAvg/plannedAvg)-1
                    }
                );

            }
        }

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
                var obj = {
                    variance: parseFloat(DataProcessing.getCostVarianceMetric(data[i])),
                    value: parseFloat(DataProcessing.getCostMainMetric(data[i])),
                    invId:data[i]["Business Case ID"],
                    plannedValue: parseFloat(DataProcessing.getCostPredictionMetric(data[i]))
                };
                if(DataProcessing.checkKeysForNan(obj)) {

                    if (investmentTotals[data[i]["Investment Title"]] !== undefined) {
                        investmentTotals[data[i]["Investment Title"]].push(obj);
                    } else {
                        investmentTotals[data[i]["Investment Title"]] = [obj];
                    }
                }
            }
        }

        for(key in investmentTotals){

            if (!investmentTotals.hasOwnProperty(key)) continue;

            var arr = investmentTotals[key];
            var varianceAvg = 0, valueAvg = 0, plannedAvg = 0;

            for (var j = 0; j < arr.length; j++) {
                varianceAvg += arr[j].variance;
                valueAvg += arr[j].value;
                plannedAvg += arr[j].plannedValue;
            }

            toReturn.push({
                name: key,
                label: arr[0].invId,
                variance: DataProcessing.calcVariance((valueAvg/plannedAvg)-1),
                agency: agency,
                value: valueAvg,
                x: Math.random() * 900,
                y: Math.random() * 800,
                colorCategory: DataProcessing.calcColorCategory((valueAvg/plannedAvg)-1),
                plannedValue: plannedAvg
            });
        }

        cb(toReturn);
    },

    agencyData: function(err, data, agency, investment, cb){

        projectTotals = {};

        var toReturn = [];
        for(var i = 0; i < data.length; i++){
            if(data[i]["Agency Code"] === agency && data[i]["Investment Title"] === investment && data[i]["Projected/Actual Cost ($ M)"] !== ""){
                var obj = {
                    variance: parseFloat(DataProcessing.getCostVarianceMetric(data[i])),
                    value: parseFloat(DataProcessing.getCostMainMetric(data[i])),
                    projId:data[i]["Project ID"],
                    plannedValue: parseFloat(DataProcessing.getCostPredictionMetric(data[i]))
                };

                if(DataProcessing.checkKeysForNan(obj)) {
                    if (projectTotals[data[i]["Project Name"]] !== undefined) {
                        projectTotals[data[i]["Project Name"]].push(obj);
                    } else {
                        projectTotals[data[i]["Project Name"]] = [obj];
                    }
                }
            }
        }

        for(key in projectTotals){

            if (!projectTotals.hasOwnProperty(key)) continue;

            var arr = projectTotals[key];
            var varianceAvg = 0.0, valueAvg = 0.0, plannedAvg = 0.0;

            for (var j = 0; j < arr.length; j++) {
                varianceAvg += arr[j].variance;
                valueAvg += arr[j].value;
                plannedAvg += arr[j].plannedValue;
            }

            toReturn.push({
                name: key,
                label: arr[0].projId,
                variance: DataProcessing.calcVariance((valueAvg/plannedAvg)-1),
                agency: agency,
                value: valueAvg,
                x: Math.random() * 900,
                y: Math.random() * 800,
                colorCategory: DataProcessing.calcColorCategory((valueAvg/plannedAvg)-1),
                plannedValue: plannedAvg
            });
        }

        cb(toReturn);
    }
};