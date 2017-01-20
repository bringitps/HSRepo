/**
 * Script will prevent the following two conditions: 
 * 
 * 1. For a given item, both Customer and Customer Type fields are populated on the same line. HS requires that only Customer OR Customer Type be populated on a single record, not both. 
 * 2. For a given item/Custom or Item/Customer Type combination, there are multiple overlapping validity periods (defined by Start Date to End Date). HS Requires that there are no overlapping periods. 
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Apr 2016     Luxent, Inc	   WIP 
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */


function userEventBeforeSubmit(type){
	var record = nlapiGetNewRecord(); 
	
	validateCusotmerAndCustomerType(record, type);
	
	findMatchingPriceLists(record, type);
	
}



function validateCusotmerAndCustomerType(record, type){
	var customer, customerType;
	
	//Inline Edit has different processes that need to be applied since only values that were changed get passed into the request. 
	if(type == 'create' || type == 'edit'){
		customer = record.getFieldValue('custrecord_pl_customer');
		customerType = record.getFieldValue('custrecord_pl_customer_type');		
	}else if(type == 'xedit'){
		//Since only the values that were changed get past into the user event script, we will need to lookup the values. 
		//If value is null, try and load it from the record to make sure it's actually null, and not just omitted from the request. Do this for both. 
		customer = (!record.getFieldValue('custrecord_pl_customer')) ? nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_customer') : record.getFieldValue('custrecord_pl_customer');
		customerType = (!record.getFieldValue('custrecord_pl_customer_type')) ? nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_customer_type') : record.getFieldValue('custrecord_pl_customer_type');
	}
	
	
	//Only Customer or Customer Type may be populated on a single record. 
	if(customer && customerType){
		nlapiLogExecution('DEBUG', 'customer + customer type', customer + ' ' + customerType);
		throw nlapiCreateError('NO_CUSTOMER_AND_CUSTOMER_TYPE', 'Both Customer and Customer Type cannot be populated for the same record.', true);
	}
	
	if(!customer && !customerType){
		throw nlapiCreateError('NO_CUSTOMER_AND_CUSTOMER_TYPE', 'Either Customer or Customer Type must be populated for this record.', true);
	}
}


function findMatchingPriceLists(record, type){ 	
	var filterExpression, customerOrCustomerType, customerOrCustomerTypeId, itemId;
	
	
	if(type == 'xedit'){
		//Checking if the customer or customer type have been populated, if neither are here, that probably means the user did not change either of them, so we should look up the value from the record. 		
		if(record.getFieldValue('custrecord_pl_customer')){
			customerOrCustomerType = 'custrecord_pl_customer';
			customerOrCustomerTypeId =  record.getFieldValue('custrecord_pl_customer');
		}else if(record.getFieldValue('custrecord_pl_customer_type')){
			customerOrCustomerType = 'custrecord_pl_customer_type';
			customerOrCustomerTypeId = record.getFieldValue('custrecord_pl_customer_type');
		}else{
			//Checking value on customer, if it's present then we will use this customer as the basis of our filter. 			
			customerOrCustomerType = ( nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_customer')) ? 'custrecord_pl_customer' : 'custrecord_pl_customer_type';
			customerOrCustomerTypeId = ( customerOrCustomerType == 'custrecord_pl_customer' ) ? nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_customer') : nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_customer_type');
		}
		
		//Again checking for value - if not present, lookup record to get existing value. 
		itemId = (record.getFieldValue('custrecord_pl_item')) ? record.getFieldValue('custrecord_pl_item') : nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_item');  
		
		filterExpression = [ 
	        [ 'custrecord_pl_item', 'anyof', itemId ],
	        'and',
	        [customerOrCustomerType, 'anyof', customerOrCustomerTypeId]
	    ];	
		
		nlapiLogExecution('AUDIT', 'filter',filterExpression);
	}else{
		//If customer is populated, query the customer, otherwise we will use the customer type. Did this to clean up the filter logic below. 
		customerOrCustomerType = (record.getFieldValue('custrecord_pl_customer')) ? 'custrecord_pl_customer' : 'custrecord_pl_customer_type';
		
		//Define our filters, we're going to be querying price lists with this item / customer / customer type combination.
		filterExpression = [ 
	        [ 'custrecord_pl_item', 'anyof', record.getFieldValue('custrecord_pl_item') ],
	        'and',
	        [customerOrCustomerType, 'anyof', record.getFieldValue(customerOrCustomerType)]
	    ];		
	}
	

	
	//If we're updating a record, then we should omit this record from our search results. 
	if(record.getId() != null){
		filterExpression.push('and');
		filterExpression.push(['internalid', 'noneof', record.getId()]);
	}
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_pl_start_date');
	columns[1] = new nlobjSearchColumn('custrecord_pl_end_date');
	
	var searchResults;
	
	try{
		searchResults= nlapiSearchRecord('customrecord_price_list', null, filterExpression, columns);
	}catch(e){
		nlapiLogExecution('DEBUG', 'search error', e);
	}
	
	var startA, startB, endA, endB;
	
	//Convert all the date fields and assign to local variables.
	if(type == 'xedit'){
		startA = (record.getFieldValue('custrecord_pl_start_date')) ? Date.parse(record.getFieldValue('custrecord_pl_start_date')) : Date.parse(nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_start_date'));
		endA = (record.getFieldValue('custrecord_pl_end_date')) ? Date.parse(record.getFieldValue('custrecord_pl_end_date')) : Date.parse(nlapiLookupField('customrecord_price_list', nlapiGetRecordId(), 'custrecord_pl_end_date'));
	}else{
		startA = Date.parse(record.getFieldValue('custrecord_pl_start_date'));
		endA = Date.parse(record.getFieldValue('custrecord_pl_end_date'));		
	}
	
	//Check that start date comes before end date. 
	if(startA > endA){
		throw nlapiCreateError('INVALID_DATE', 'Start Date must begin before End Date.');
	}

	
	if(searchResults){		
		for(var i = 0; i < searchResults.length; i++){
			result = searchResults[i];
			
			startB = Date.parse(result.getValue('custrecord_pl_start_date'));
			endB = Date.parse(result.getValue('custrecord_pl_end_date'));
			
			nlapiLogExecution('DEBUG', 'condition 1', startA <= endB);
			nlapiLogExecution('DEBUG', 'condition 2', endA >= startB);
			
			if((startA < endB) && (endA > startB)){
				throw nlapiCreateError('DATE_RANGE', 'Price for that date range already exists for this item.', true);
			}
		}		
	}
}
	



