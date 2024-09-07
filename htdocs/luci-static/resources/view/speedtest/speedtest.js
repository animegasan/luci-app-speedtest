/* This is free software, licensed under the Apache License, Version 2.0
 *
 * Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>
 */

'use strict';
'require view';
'require fs';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	render: function() {
		var header = [
			E('h2', {'class': 'section-title'}, _('Speedtest')),
			E('div', {'class': 'cbi-map-descr'}, _('Here you can perform a speed test to measure the basic aspects of your network connection.'))
		];
		var running = false, open = false;
		var value = [
			['all', _('All')],
			['latency', _('Latency')],
			['download', _('Download Speed')],
			['upload', _('Upload Speed')]
		];
		var speedtest = [
			E('div', {'class': 'controls', 'style': 'display: flex; justify-content: space-between; padding: 1em 0;'}, [
				E('div', {'class': 'status', 'style': 'align-self: center;'}, [
					E('label', {'class': 'cbi-input-label', 'style': 'margin-right: 8px;'}, _('Status')),
					E('em', {'id': 'status'}, _('Available'))
				]),
				E('div', {'class': 'cbi-dropdown btn cbi-button cbi-button-apply important'}, [
					E('span', {
						'class': 'type',
						'data-value': 'all',
						'style': 'margin: 0 0 0 13px !important',
						'click': function() {
							if (!running) {
								running = true, open = true;
								var value = this.getAttribute('data-value');
								var command = ['--output', 'json'];
								if (value !== 'all') {
									command.push('--' + value);
								};
								var status = document.getElementById('status');
								status.textContent = _('Running');
								fs.exec_direct('speedtest', command).then(function(response) {
									var result = JSON.parse(response);
									var date = new Date().toLocaleDateString(undefined, {
										weekday: 'short',
										month: 'short',
										day: '2-digit'
									});
									var time = new Date().toLocaleTimeString(undefined, {
										hour: '2-digit',
										minute: '2-digit'
									});
									var type = value.charAt(0).toUpperCase() + value.slice(1);
									var ping = result.ping ? result.ping + ' ms' : '-';
									var jitter = (result.jitter !== undefined && result.jitter !== null) ? result.jitter + ' ms' : '-';
									var download = result.download_mbit ? result.download_mbit + ' Mbit/s' : '-';
									var upload = result.upload_mbit ? result.upload_mbit + ' Mbit/s' : '-';
									var latency = result.server.latency ? result.server.latency + ' ms' : '-';
									document.getElementById('client-ip').textContent = result.client.ip;
									document.getElementById('client-isp').textContent = result.client.isp + ' [' + result.client.lat + ', ' + result.client.lon + ']';
									document.getElementById('server-name').textContent = result.server.sponsor;
									document.getElementById('server-id').textContent = result.server.id;
									document.getElementById('server-location').textContent = result.server.name + ' (' + result.server.distance + ' km)';
									document.getElementById('server-host').textContent = result.server.host;
									document.getElementById('ping').textContent = ping;
									document.getElementById('jitter').textContent = jitter;
									document.getElementById('latency').textContent = latency;
									document.getElementById('download').textContent = download;
									document.getElementById('upload').textContent = upload;
									status.textContent = _('Finished');
									running = false, open = false;
									var resultString = '| ' + date + ' | ' + time + ' | LuCI | ' + type + ' | ' + ping + ' | ' + jitter + ' | ' + latency + ' | ' + download + ' | ' + upload + ' |\n';
									var files = '/etc/speedtest_result';
									fs.read(files).then(function(data) {
										var newData = data.trim() + '\n' + resultString;
										fs.write(files, newData);
									});
								}).catch(function(err) {
									if (!err.response) {
										status.textContent = _('No response received from speedtest. Please check your internet connection or try again later.');
									} else if (err.response.data && err.response.data.error === 'unable to retrieve your ip info') {
										status.textContent = _('Unable to retrieve IP information. Please check your internet connection.');
									} else {
										status.textContent = err;
									};
									running = false, open = false;
								});
							};
						}
					}, _('Test All')),
					E('span', {
						'class': 'open',
						'click': function(event) {
							if (!open) {
								event.stopPropagation();
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
					}, [' ▾']),
					E('ul', {
						'class': 'dropdown',
						'click': function(event) {
							event.stopPropagation();
						}
					}, value.map(function(item) {
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
								text.textContent = _('Test %s').format(this.textContent);
								text.setAttribute('data-value', this.dataset.value);
								id.removeAttribute('open');
								running = false, open = false;
							}
						}, item[1]);
					}))
				])
			]),
			E('table', {'class': 'table cbi-section-table'}, [
				E('tr', {'class': 'tr table-titles'}, [
					E('th', {'class': 'th left', 'width': '50%'}, _('Category')),
					E('th', {'class': 'th'}, _('Result'))
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('IP Address')),
					E('td', {'class': 'td', 'id': 'client-ip'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Provider')),
					E('td', {'class': 'td', 'id': 'client-isp'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Server')),
					E('td', {'class': 'td', 'id': 'server-name'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('ID')),
					E('td', {'class': 'td', 'id': 'server-id'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Location')),
					E('td', {'class': 'td', 'id': 'server-location'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Server Host')),
					E('td', {'class': 'td', 'id': 'server-host'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Ping')),
					E('td', {'class': 'td', 'id': 'ping'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Jitter')),
					E('td', {'class': 'td', 'id': 'jitter'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Latency')),
					E('td', {'class': 'td', 'id': 'latency'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-2'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Download Speed')),
					E('td', {'class': 'td', 'id': 'download'}, '-')
				]),
				E('tr', {'class': 'tr cbi-rowstyle-1'}, [
					E('td', {'class': 'td left', 'width': '50%'}, _('Upload Speed')),
					E('td', {'class': 'td', 'id': 'upload'}, '-')
				])
			])
		];
		return E('div', {'class': 'cbi-map'}, [
			E(header),
			E('div', {'class': 'cbi-section'}, [
				E('div', {'class': 'speedtest'}, speedtest)
			])
		]);
	}
});
