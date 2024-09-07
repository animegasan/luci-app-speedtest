/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require view';
'require fs';
'require ui';

var page = 1;
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
			};
			var values = lines[i].split('|').map(function(item) {
				return item.trim();
			}).filter(function(item) {
				return item !== '';
			});
			var dataObj = {};
			for (var j = 0; j < header.length; j++) {
				dataObj[header[j]] = values[j];
			};
			resultData.push(dataObj);
		};
		return resultData;
	}).catch(function(err) {
		throw new Error(err);
	});
};

function deleteData(indexToDelete) {
	return fs.read(files).then(function(data) {
		var lines = data.split('\n');
		if (indexToDelete < 0 || indexToDelete >= lines.length - 1) {
			throw new Error(_('Invalid index'));
		};
		lines.splice(indexToDelete + 1, 1);
		var newData = lines.join('\n');
		return fs.write(files, newData).then(function() {
			var rowDelete = document.querySelector('.tr[data-index="' + indexToDelete + '"]');
			if (rowDelete) {
				rowDelete.parentNode.removeChild(rowDelete);
			};
		}).catch(function(err) {
			throw new Error(err);
		});
	}).catch(function(err) {
		throw new Error(err);
	});
};

function renderTable(data, display) {
	var startIndex = (page - 1) * display;
	var endIndex = Math.min(startIndex + display, data.length);
	var currentPageData = data.slice(startIndex, endIndex);
	var dataRows = currentPageData.map(function(data, index) {
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
									};
									return window.location.reload();
								}).catch(function(err) {
									throw new Error(err);
									ui.hideModal();
								});
							}
						}, _('Delete'))
					])
				]);
			}
		}, _('Delete'));
		return E('tr', {'class': 'tr' + rowClass, 'data-index': index}, [
			E('td', {'class': 'td'}, data.date),
			E('td', {'class': 'td'}, data.time),
			E('td', {'class': 'td'}, data.method),
			E('td', {'class': 'td'}, data.test),
			E('td', {'class': 'td'}, data.ping),
			E('td', {'class': 'td'}, data.jitter),
			E('td', {'class': 'td'}, data.latency),
			E('td', {'class': 'td'}, data.download),
			E('td', {'class': 'td'}, data.upload),
			E('td', {'class': 'td'}, rowButton)
		]);
	});
	return E('table', {'class': 'table cbi-section-table'}, [
		E('tr', {'class': 'tr table-titles'}, [
			E('th', {'class': 'th'}, _('Date')),
			E('th', {'class': 'th'}, _('Time')),
			E('th', {'class': 'th'}, _('Method')),
			E('th', {'class': 'th'}, _('Test')),
			E('th', {'class': 'th'}, _('Ping')),
			E('th', {'class': 'th'}, _('Jitter')),
			E('th', {'class': 'th'}, _('Latency')),
			E('th', {'class': 'th'}, _('Download Speed')),
			E('th', {'class': 'th'}, _('Upload Speed')),
			E('th', {'class': 'th'})
		]),
		E(dataRows)
	]);
};

function updateTable(data, display) {
	var container = document.getElementsByClassName('table-container');
	var prev = document.querySelector('.prev');
	var next = document.querySelector('.next');
	for (var i = 0; i < container.length; i++) {
		container[i].innerHTML = '';
		var table = renderTable(data, display);
		container[i].appendChild(table);
	};
	var total = data.length;
	var pages = Math.ceil(total / display);
	if (pages <= 1) {
		prev.disabled = true, next.disabled = true;
	} else if (page <= 1) {
		prev.disabled = true, next.disabled = false;
	} else if (page >= pages) {
		prev.disabled = false, next.disabled = true;
	} else {
		prev.disabled = false, next.disabled = false;
	};
	var start = (page - 1) * display + 1;
	var end = Math.min(start + display - 1, total);
	return document.getElementById('page-info').innerText = _('Displaying %s - %s of %s').format(start, end, total);
};

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	load: function() {
		return readData();
	},
	render: function(data) {
		var result, footer, header = [
			E('h2', {'class': 'section-title'}, _('Speedtest')),
			E('div', {'class': 'cbi-map-descr'}, _('Here you can perform a speed test to measure the basic aspects of your network connection.'))
		];
		var running = false, open = false;
		var value = [
			['All', _('All')],
			['LuCI', _('LuCI')],
			['Schedule', _('Schedule')]
		];
		if (data.length > 0) {
			result = [
				E('div', {'class': 'controls', 'style': 'display: flex; flex-wrap: wrap; justify-content: space-around; padding: 1em 0;'}, [
					E('button', {
						'class': 'btn cbi-button-neutral prev',
						'style': 'flex-basis: 20%; text-align: center;',
						'disabled': true,
						'click': function() {
							page--, updateTable(data, 10);
						}
					}, '«'),
					E('div', {
						'class': 'text',
						'id': 'page-info',
						'style': 'flex-grow: 1; align-self: center; text-align: center;'
					}, _('Displaying 1-%s of %s').format(Math.min(10, data.length), data.length)),
					E('button', {
						'class': 'btn cbi-button-neutral next',
						'style': 'flex-basis: 20%; text-align: center;',
						'disabled': 10 < data.length ? null : true,
						'click': function() {
							page++, updateTable(data, 10);
						}
					}, '»')
				]),
				E('div', {'class': 'table-container'}, renderTable(data, 10))
			];
			footer = [
				E('div', {'class': 'cbi-page-actions'}, [
					E('div', {'class': 'cbi-dropdown btn cbi-button cbi-button-apply important', 'style': 'margin-right: 5px;'}, [
						E('span', {
							'class': 'type',
							'data-value': 'All',
							'style': 'margin: 0 0 0 13px !important',
							'click': function() {
								if (!running) {
									var method = this.getAttribute('data-value');
									return fs.read(files).then(function(data) {
										var filteredData, lines = data.split('\n');
										var header = lines[0].split('|');
										if (method === 'All') {
											filteredData = lines.slice(1).join('\n');
										} else {
											filteredData = lines.slice(1).filter(function(line) {
												return line.includes(method);
											}).join('\n');
										};
										var data = header.join('|') + '\n' + filteredData;
										var blob = new Blob([data], {type: 'text/plain'});
										var link = document.createElement('a');
										link.href = window.URL.createObjectURL(blob);
										link.download = `speedtest_${method}_result.txt`;
										link.click();
									}).catch(function(err) {
										throw new Error(err);
									});
								};
							}
						}, _('Download All')),
						E('span', {
							'class': 'open',
							'click': function() {
								if (!open) {
									var id = this.parentNode;
									var menu = id.querySelector('ul');
									if (id.hasAttribute('open')) {
										id.removeAttribute('open');
										menu.style.top = '';
										running = false;
									} else {
										id.setAttribute('open', '');
										menu.style.top = '28px';
										running = true;
									};
								};
							}
						}, ' ▾'),
						E('ul', {'class': 'dropdown'}, value.map(function(item) {
							return E('li', {
								'data-value': item[0],
								'class': item[0] === 'all' ? 'focus' : '',
								'click': function() {
									var id = this.parentNode.parentNode;
									var text = this.parentNode.previousElementSibling.previousElementSibling;
									id.querySelectorAll('li').forEach(function(li) {
										li.classList.remove('focus');
									});
									this.classList.add('focus');
									text.textContent = _('Download %s').format(this.textContent);
									text.setAttribute('data-value', this.dataset.value);
									id.removeAttribute('open');
									running = false, open = false;
								}
							}, item[1])
						}))
					]),
					E('button', {
						'class': 'cbi-button cbi-button-reset',
						'click': function() {
							ui.showModal(_('Clear data'), [
								E('p', _('Are you sure you want to clear all data?')),
								E('div', {'class': 'right'}, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Cancel')),
									' ',
									E('button', {
										'class': 'btn cbi-button cbi-button-remove',
										'click': function() {
											return fs.read(files).then(function(data) {
												var lines = data.split('\n');
												var header = lines[0].split('|');
												var newData = header.join('|') + '\n';
												fs.write(files, newData);
												return window.location.reload();
											}).catch(function(err) {
												throw new Error(err);
											});
										}
									}, _('Clear'))
								])
							]);
						}
					}, _('Clear'))
				])
			];
		} else {
			result = [
				E('div', {'class': 'cbi-value', 'style': 'text-align: center; display: block;'}, [
					E('em', _('No data available.'))
				])
			];
			footer = [];
		};
		return E('div', {'class': 'cbi-map'}, [
			E(header),
			E('div', {'class': 'cbi-section'}, [
				E('div', {'class': 'speedtest-result'}, [
					E('h3', {'class': 'section-title'}, _('Results')),
					E(result)
				])
			]),
			E(footer)
		]);
	}
});
