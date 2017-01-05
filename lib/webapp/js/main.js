/**
 * Created by mcaputo on 12/4/16.
 */

var BASE_URL = 'http://localhost:9375' //'http://sentinel.caputo.io';

function submitSite() {
    var url = $('#url-input').val();
    var siteName = $('#siteName').val();
    var siteType = $('#type-checker').val();

    if (!siteName) {
        showError('Name is required');
        return;
    }

    if (!url) {
        showError('URL is required');
        return;
    }


    var isValidUrl = hasHttp(url);
    if (!isValidUrl) {
        url = 'http://' + url;
    }

    var siteData = { name: siteName, url: url, type: siteType };

    console.log('data:', siteData);
    console.log('base url:', BASE_URL);
    $.ajax({
        type: 'POST',
        url : BASE_URL + '/site',
        data: siteData,
        success: function(response, data, err) {
            console.log('response:', response);
            console.log('data:', data);
            console.log('err:', err);

            // Show success message
            $('#save-alert-danger').css('display', 'none');
            $('#save-alert-success').css('display', 'block');
            $('#save-alert-success').css('visibility', 'visible');

            addItemToList(response.data);

$('#save-alert-success').css('opacity', '1.0');
},
error: showError,
    dataType: 'json'
})

}

var urlList = document.getElementsByClassName('url-list')[0];

buildUrlList();

function buildUrlList() {
    $.ajax({
       type: 'GET',
        url: BASE_URL + '/site',
        success: function(response, data, err) {
           console.log('response: ', response);
           response.map(function(urlObj) { addItemToList(urlObj)});
        }
    });
}

function addItemToList(urlObj) {
    var newItem = document.createElement('li');
    //newItem.appendChild(document.createTextNode(urlObj.name));
    newItem.className = 'table-row';
    var urlContainer = document.createElement('span');
    urlContainer.className = 'url-label';
    var urlLabel = document.createElement('p');
    urlLabel.appendChild(document.createTextNode(urlObj.name));
    urlContainer.appendChild(urlLabel);

    var urlDataContainer = document.createElement('span');
    urlDataContainer.className = 'url-data';
    var urlPath = document.createElement('p');
    urlPath.appendChild(document.createTextNode(urlObj.url));
    urlDataContainer.appendChild(urlPath);

    newItem.appendChild(urlContainer);
    newItem.append(urlDataContainer);

    $(newItem).append('<span class="url-last-modified"><p>' + urlObj.last_updated + '</p></span>');

    $('.url-list').prepend(newItem);
}

function hasHttp(url) {
    return url.slice(0, 4).indexOf('http') >= 0;
}

function showError(err) {
    $('#save-alert-success').css('display', 'none');
    $('#save-alert-danger').css('display', 'block');
    $('#save-alert-danger').css('visibility', 'visible');
    $('#save-alert-danger').css('opacity', '1.0');
    $('#save-alert-danger').text(err);
}
