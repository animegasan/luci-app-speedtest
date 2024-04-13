/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require view';
'require fs';
'require ui';

var files = '/etc/speedtest_result';
function readData() {
	return fs.read(files).then(function(data) {
		var lines = data.split('\n');
		var header = lines[0].split('|').map(function(item) {
			return item.trim();
		}).filter(function(item) {
			return item !== '';
		});
		var resultData = [];
		for (var i = 1; i < lines.length; i++) {
			if (lines[i].trim() === '') {
				continue;
			}
			var values = lines[i].split('|').map(function(item) {
				return item.trim();
			}).filter(function(item) {
				return item !== '';
			});
			var dataObj = {};
			for (var j = 0; j < header.length; j++) {
				dataObj[header[j]] = values[j];
			}
			resultData.push(dataObj);
		}
		return resultData;
	}).catch(function(err) {
		console.error('Error:', err);
		return [];
	});
};

function deleteData(indexToDelete) {
	return fs.read(files).then(function(data) {
		var lines = data.split('\n');
		if (indexToDelete < 0 || indexToDelete >= lines.length - 1) {
			throw new Error(_('Invalid index'));
		}
		lines.splice(indexToDelete + 1, 1);
		var newData = lines.join('\n');
		return fs.write(files, newData).then(function() {
			var rowDelete = document.querySelector('.tr[data-index="' + indexToDelete + '"]');
			if (rowDelete) {
				rowDelete.parentNode.removeChild(rowDelete);
			}
			return _('Data deleted successfully');
		}).catch(function(err) {
			throw err;
		});
	}).catch(function(err) {
		console.error('Error:', err);
		throw err;
	});
};

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	load: function() {
		return readData();
	},
	render: function(data) {
		var header = [
			E('h2', {'class': 'section-title'}, _('Speedtest')),
			E('div', {'class': 'cbi-map-descr'}, _('Here you can perform a speed test to measure the basic aspects of your network connection.'))
		];
		var result;
		if (data.length > 0) {
			var dataRows = data.map(function(data, index) {
				var rowClass = index % 2 === 0 ? 'cbi-rowstyle-1' : 'cbi-rowstyle-2';
				var rowButton = E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': function() {
						var indexToDelete = index;
						ui.showModal(_('Delete data'), [
							E('p', _('Are you sure you want to delete this data?')),
							E('div', {'class': 'right'}, [
								E('button', {
									'class': 'btn',
									'click': ui.hideModal
								}, _('Cancel')),
								' ',
								E('button', {
									'class': 'btn cbi-button cbi-button-remove',
									'click': function() {
										deleteData(indexToDelete).then(function() {
											var rowDelete = document.querySelector('.tr[data-index="' + indexToDelete + '"]');
											if (rowDelete) {
												rowDelete.parentNode.removeChild(rowDelete);
											}
											ui.hideModal();
										}).catch(function(err) {
											console.error(_('Error deleting data'), + ':' + err);
											ui.hideModal();
										});
									}
								}, _('Delete'))
							])
						]);
					}
				}, _('Delete'));
				return E('tr', {'class': 'tr ' + rowClass, 'data-index': index}, [
					E('td', {'class': 'td'}, data.date),
					E('td', {'class': 'td'}, data.time),
					E('td', {'class': 'td'}, data.test),
					E('td', {'class': 'td'}, data.ping),
					E('td', {'class': 'td'}, data.jitter),
					E('td', {'class': 'td'}, data.download),
					E('td', {'class': 'td'}, data.upload),
					E('td', {'class': 'td'}, rowButton)
				]);
			});
			result = [
				E('h3', {'class': 'section-title'}, _('Results')),
				E('table', {'class': 'table cbi-section-table'}, [
					E('tr', {'class': 'tr table-title'}, [
						E('th', {'class': 'th '}, _('Date')),
						E('th', {'class': 'th '}, _('Time')),
						E('th', {'class': 'th '}, _('Test')),
						E('th', {'class': 'th '}, _('Ping')),
						E('th', {'class': 'th '}, _('Jitter')),
						E('th', {'class': 'th '}, _('Download Speed')),
						E('th', {'class': 'th '}, _('Upload Speed')),
						E('th', {'class': 'th '})
					]),
					E(dataRows)
				])
			];
		} else {
			result = E('div', {'class': 'cbi-section'}, _('No data available.'));
		}
		return E('div', {'class': 'cbi-map'}, [
			E(header),
			E('div', {'class': 'cbi-section'}, [
				E('div', {'class': 'speedtest-result'}, result)
			])
		]);
	}
});

