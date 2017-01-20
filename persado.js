const csv = require('fast-csv');
const args = process.argv.slice(2);

const replaceEmojis = (str) => {
	return str.replace(/[^a-zA-Z0-9.!@?#"$%&:';()*\+,\/;\-=[\\\]\^_{|}<>~` ]/g, '_EMOJI_').replace(/[^\s]*_EMOJI_[^\s]*/g, '__');
};

const getOrder = () => {
	let order = {};
	return new Promise((resolve, reject) => {
		csv.fromPath(args[0], {
			headers: true
		}).on('data', (data) => {
			order[replaceEmojis(data['Subject Line'])] = data.ID;
		}).on('end', () => {
			resolve(order);
		});
	});
};

const orderData = (order) => {
	let orderedData = [];
	return new Promise((resolve, reject) => {
		csv.fromPath(args[1], {
			headers: true
		}).on('data', (data) => {
			const subject = replaceEmojis(data.Subject);
			orderedData.push({
				'ID': order[subject],
				'Subject Line': subject,
				'Delivered': data.Sent,
				'Opened': data['Est. Opens'],
				'Clicked': data.Clicks
			});
		}).on('end', () => {
			resolve(orderedData.sort((a, b) => {
				const idA = parseInt(a.ID, 10);
				const idB = parseInt(b.ID, 10);
				if (idA && idB) {
					if (idA < idB) return -1;
					if (idA > idB) return 1;
					if (idA === idB) return 0;
				}
			}));
		});
	});
};

const writeOrderedData = (data) => {
	const path = args[2] || './upload.csv';
	csv.writeToPath(path, data, {
		headers: true
	}).on('finish', () => {
		console.log('Created upload file: ' + path);
	});
};

getOrder().then(orderData).then(writeOrderedData);