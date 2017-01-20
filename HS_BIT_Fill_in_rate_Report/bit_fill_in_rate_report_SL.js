/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Jan 2017     seko
 *
 */


function reportLoadForm(request, response)
{
	try
	{
		if (request.getMethod() == 'GET') 
		{
			var form = nlapiCreateForm('Fill In Rate Report');	
			
			var warningMessage = form.addField('custpage_warnmessage', 'inlinehtml', null, null, null);
			warningMessage.setDefaultValue("<div id='div__warnmsg' align='center'></div><script>showAlertBox('div__warnmsg', 'Warning', 'Please be careful selecting a Date Range.</br>There is a NetSuite restriction on the number of records to fetch.</br></br> Building CSV report could take up to 5 minutes depending on quantity of Orders.', NLAlertDialog.TYPE_MEDIUM_PRIORITY,  '100%', null, null, null);</script></div>");				
						
			// Save Script URL to Reset Button
			var scriptUrlValue = request.getURL() + '?';
			var params = request.getAllParameters();
			for ( param in params )
			{
				scriptUrlValue += param + '=' + params[param] + '&';
			}
			
			var scriptUrlField = form.addField('custpage_scripturl', 'text', 'Script URL').setDisplayType('hidden');
			scriptUrlField.setDefaultValue(scriptUrlValue);		
			
			//POST Button
			form.addSubmitButton('Get Report');
	
			//adding From date
			form.addField('custpage_fromdate', 'date', 'From Date').setMandatory( true );
			
			//adding To date
			form.addField('custpage_todate', 'date', 'To Date').setMandatory( true );

			//adding Reset Page Button
			form.addButton('custpage_resetpage','Reset form','javascript:window.location.href=\'' + scriptUrlValue + '\';');
					
			response.writePage(form);
		}else{
			
			var form = nlapiCreateForm('Fill In Rate Report');
			
			var scriptUrlValue =  request.getParameter('custpage_scripturl');
			var scriptUrlField = form.addField('custpage_scripturl', 'text', 'Script URL').setDisplayType('hidden');
			scriptUrlField.setDefaultValue(scriptUrlValue);		
			
			//adding Reset Page Button
			form.addButton('custpage_resetpage','Reset form','javascript:window.location.href=\'' + scriptUrlValue + '\';');
			var fromDate = new Date(request.getParameter('custpage_fromdate'));
			var toDate = new Date(request.getParameter('custpage_todate'));
			
			var sublist = form.addSubList("custpage_items", "list", "ItemList");
			
			sublist.addField("custpage_sdate", "text", "Ship Date").setDisplayType('inline');
			sublist.addField("custpage_totalorders", "text", "Orders").setDisplayType('inline');
			sublist.addField("custpage_nobo", "text", "w/o Backorder").setDisplayType('inline');
			sublist.addField("custpage_nobopct", "text", "w/o BO %").setDisplayType('inline');
			sublist.addField("custpage_withbo", "text", "with Backorder").setDisplayType('inline');
			sublist.addField("custpage_withbopct", "text", "with BO %").setDisplayType('inline');
			/*
			 * Functions to get the ItemFulfillment information per each SO
			 * by Edgar Beltran
			 * Jan 2017
			 * */
			var srSalesOrderFulfillmentDetails = new Array();
			getSalesOrderFulfillmentDetails(srSalesOrderFulfillmentDetails, -1);
			
			var soFulfillmentDetailsSalesOrderIdMtx = new Array();
			var soFulfillmentDetailsSalesOrderStatusMtx = new Array();
			var soFulfillmentDetailsFirstIFIdMtx = new Array();
			var soFulfillmentDetailsFirstIFDateMtx = new Array();
			var soFulfillmentDetailsTotalIFMtx = new Array();
			
			for(var i=0; notEmpty(srSalesOrderFulfillmentDetails) && i<srSalesOrderFulfillmentDetails.length; i++)
			{
				for(var j=0; notEmpty(srSalesOrderFulfillmentDetails[i]) && j<srSalesOrderFulfillmentDetails[i].length; j++)
				{
					var soFulfillmentDetailsIndex = soFulfillmentDetailsSalesOrderIdMtx.indexOf(srSalesOrderFulfillmentDetails[i][j].getValue('internalid', null, 'group'));
					
					if(soFulfillmentDetailsIndex == -1)
					{	
						soFulfillmentDetailsSalesOrderIdMtx.push(srSalesOrderFulfillmentDetails[i][j].getValue('internalid', null, 'group'));
						soFulfillmentDetailsSalesOrderStatusMtx.push(srSalesOrderFulfillmentDetails[i][j].getValue('status', null, 'max'));
						if(notEmpty(srSalesOrderFulfillmentDetails[i][j].getValue('internalid','fulfillingtransaction', 'group')))
						{
							soFulfillmentDetailsFirstIFIdMtx.push(srSalesOrderFulfillmentDetails[i][j].getValue('internalid','fulfillingtransaction', 'group'));
							soFulfillmentDetailsFirstIFDateMtx.push(srSalesOrderFulfillmentDetails[i][j].getValue('datecreated','fulfillingtransaction', 'max'));
							soFulfillmentDetailsTotalIFMtx.push(1);
						}
						else
						{
							soFulfillmentDetailsFirstIFIdMtx.push(null);
							soFulfillmentDetailsFirstIFDateMtx.push(null);
							soFulfillmentDetailsTotalIFMtx.push(0);
						}
					}
					else
					{
						if(notEmpty(srSalesOrderFulfillmentDetails[i][j].getValue('internalid','fulfillingtransaction', 'group')))
						{
							//NetSuite ascendently assigns ID, so the lowest is the first Item Fulfillment
							if(soFulfillmentDetailsFirstIFIdMtx[soFulfillmentDetailsIndex] > srSalesOrderFulfillmentDetails[i][j].getValue('internalid','fulfillingtransaction', 'group')) 
							{
								soFulfillmentDetailsFirstIFIdMtx[soFulfillmentDetailsIndex] = srSalesOrderFulfillmentDetails[i][j].getValue('internalid','fulfillingtransaction', 'group');
								soFulfillmentDetailsFirstIFDateMtx[soFulfillmentDetailsIndex] = srSalesOrderFulfillmentDetails[i][j].getValue('datecreated','fulfillingtransaction', 'max');
							}
							soFulfillmentDetailsTotalIFMtx[soFulfillmentDetailsIndex] = soFulfillmentDetailsTotalIFMtx[soFulfillmentDetailsIndex] + 1;
						}
					}
				}
			}
			// End of Edgar's functions

			var finalArray = new Array();
			var range = getDates(fromDate,toDate);
			nlapiLogExecution('debug','Days to fetch',range.length);
			nlapiLogExecution('debug','fromDate',fromDate);
			nlapiLogExecution('debug','toDate',toDate);
			var totalOrders =0;
			var totalNoBO =0;
			var totalWithBO = 0;
		
			for(var y = 0; y < range.length; y++){
				var shipdate = range[y].getTime();
				var dayOrders = 0;
				var dayNoBO = 0;
				var dayWithBO= 0;
				
			    for(var i = 0; i < soFulfillmentDetailsFirstIFDateMtx.length; i++){
			    	var deit = new Date(soFulfillmentDetailsFirstIFDateMtx[i]).setHours(0,0,0,0);
			        if ( deit === shipdate){

			            dayOrders = dayOrders +1;
			            if(soFulfillmentDetailsTotalIFMtx[i] > 1){
			            	dayWithBO = dayWithBO +1;
			            }else{
			            	if(soFulfillmentDetailsSalesOrderStatusMtx[i] === 'Partially Fulfilled'){
			            		dayWithBO = dayWithBO +1;
			            	}else{
			            		dayNoBO = dayNoBO +1;
			            	}
			            	
			            }
			    	}
			    }
				var dateDetail = new Object();
				dateDetail['shipdate']= formatDate(shipdate);
				dateDetail['totalorders'] = dayOrders;
				dateDetail['noBO'] = dayNoBO;
				dateDetail['noBO_pct'] = getNum(((dayNoBO*100)/dayOrders).toFixed(2)) + "%";
				dateDetail['withBO'] = dayWithBO;
				dateDetail['withBO_pct'] = getNum(((dayWithBO*100)/dayOrders).toFixed(2)) + "%";
				finalArray.push(dateDetail);
				
				totalOrders = totalOrders + dayOrders;
				totalNoBO = totalNoBO + dayNoBO;
				totalWithBO= totalWithBO + dayWithBO;	

			}


			
			populateList(form,finalArray,totalOrders,totalNoBO,totalWithBO);
			response.writePage(form);
			/*
			// Create CSV with Summary
			var csvHeader = 'Ship Date,Total Orders,w/o B/O, %, w B/O,%\n';
			var csvContent = '';
			var csvFooter = 'Totals,'+totalOrders+','+totalNoBO+','+getNum(((totalNoBO*100)/totalOrders).toFixed(2)) + '%'+','+totalWithBO+','+getNum(((totalWithBO*100)/totalOrders).toFixed(2)) + '%\n';
			nlapiLogExecution('debug','Total finalArray length',finalArray.length);
			for(var i=0; i<finalArray.length; i++){
				csvContent += finalArray[i].shipdate+','+finalArray[i].totalorders+','+finalArray[i].noBO+','+finalArray[i].noBO_pct+','+finalArray[i].withBO+','+finalArray[i].withBO_pct+'\n';
			}
			
			response.setContentType('PLAINTEXT', 'Fill_in_rate_report.csv', 'attachment');
			var csvFileContent = csvHeader + csvContent + csvFooter;					
			response.write(csvFileContent);
			*/
		}
	}
	catch(Ex)
	{
        nlapiLogExecution('error', 'Unexpected Error', Ex);
	}
	
}

function populateList(form,results,totalOrders,totalNoBO,totalWithBO){
	var index =0;
	for (var s = 0; s < results.length; s++) 
	{
			form.getSubList('custpage_items').setLineItemValue('custpage_sdate', index + 1, results[s].shipdate);
			form.getSubList('custpage_items').setLineItemValue('custpage_totalorders', index + 1, results[s].totalorders);
			form.getSubList('custpage_items').setLineItemValue('custpage_nobo', index + 1, results[s].noBO);
			form.getSubList('custpage_items').setLineItemValue('custpage_nobopct', index + 1, results[s].noBO_pct);
			form.getSubList('custpage_items').setLineItemValue('custpage_withbo', index + 1, results[s].withBO);
			form.getSubList('custpage_items').setLineItemValue('custpage_withbopct', index + 1, results[s].withBO_pct);
			index=index+1;
	
	}
	form.getSubList('custpage_items').setLineItemValue('custpage_sdate', index + 1, '<b>Totals</b>');
	form.getSubList('custpage_items').setLineItemValue('custpage_totalorders', index + 1, '<b>'+totalOrders+'</b>');
	form.getSubList('custpage_items').setLineItemValue('custpage_nobo', index + 1, '<b>'+totalNoBO+'</b>');
	form.getSubList('custpage_items').setLineItemValue('custpage_nobopct', index + 1, '<b>'+getNum(((totalNoBO*100)/totalOrders).toFixed(2)) + '%</b>');
	form.getSubList('custpage_items').setLineItemValue('custpage_withbo', index + 1, '<b>'+totalWithBO+'</b>');
	form.getSubList('custpage_items').setLineItemValue('custpage_withbopct', index + 1,'<b>'+getNum(((totalWithBO*100)/totalOrders).toFixed(2)) + '%</b>');
	
}
function getSalesOrderFulfillmentDetails(srArray, maxId)
{
	var salesOrderFilters = new Array();
	if(maxId > 0) salesOrderFilters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', maxId));
	salesOrderFilters.push(new nlobjSearchFilter('mainline', null, 'is', 'F'));
	salesOrderFilters.push(new nlobjSearchFilter('status', null, 'anyOf', ['SalesOrd:D','SalesOrd:E','SalesOrd:F','SalesOrd:G','SalesOrd:H']));
	
	var salesOrderColumns = new Array();
	salesOrderColumns.push(new nlobjSearchColumn('internalid', null, 'group').setSort());
	salesOrderColumns.push(new nlobjSearchColumn('internalid','fulfillingtransaction', 'group'));
	salesOrderColumns.push(new nlobjSearchColumn('tranid','fulfillingtransaction', 'max'));
	salesOrderColumns.push(new nlobjSearchColumn('datecreated','fulfillingtransaction', 'max'));
	salesOrderColumns.push(new nlobjSearchColumn('status', null, 'max'));
	
	var srResults = nlapiSearchRecord('salesorder', null, salesOrderFilters, salesOrderColumns); 
	
	if(notEmpty(srResults) && srResults.length > 999)
	{
		//Last SO validation
		var lastId = srResults[999].getValue('internalid', null, 'group');
		while(srResults[srResults.length-1].getValue('internalid', null, 'group') == lastId)
			srResults = srResults.slice(0, -1);
		
		srArray.push(srResults);
		getSalesOrderFulfillmentDetails(srArray, srResults[srResults.length-1].getValue('internalid', null, 'group'));
	}
	else 
		srArray.push(srResults);
}


//--- General Javascript Functions ---//
function getNum(val) {
	if (isNaN(val)) {
		return 0;
	}
	return val;
}

function isEmpty(val) {
	return (val == null || val == '' || val == 'null');
}

function notEmpty(tmp) {
	return !isEmpty(tmp);
}

function formatDate(date) {
    var d = new Date(date);
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push( new Date (currentDate) );
        currentDate = addDays(currentDate,1);
    }
    return dateArray;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

