// hide with https://www.javascriptobfuscator.com/Javascript-Obfuscator.aspx

// parameters
avg_beats = 4;	// numb of samples to average over for current BPM
plot_len = 150;	// numb of points to plot
time_diff_limit = 1000;	// limit length of time_diff vector - prevent memory leak

// starting settings
time_diffs = [];
time_prev = 0;
time_first = 0;
graph_len = 0;	// current data length of graph
bpm_avg = 0;

// create graph object
var chart;
construct_graph();

function get_beat() {
	// time - time_prev - milliseconds since last click
	var time = (new Date).getTime();

	// store time difference
	time_diffs.push(time - time_prev);
	// remove first if vector too long
	if (time_diffs.length > time_diff_limit) {
		time_diffs.shift();
	}

	// reset if 4 beats have past
	if (too_long(time - time_prev)) {
		return reset(time);
	}

	// otherwise
	// if using averaging length:
	if (time_diffs.length >= avg_beats) {
		// find bpm, based on milliseconds
		// sum time over avg_beats beats
		var time_lag = 0;
		for (var i = 1; i <= avg_beats; i++) {
			time_lag += time_diffs[time_diffs.length - i];	// last element - i
		}

		// compute average BPM
		bpm_avg = 60000 * avg_beats / time_lag;
	} else {
		// use only last time_diff
		bpm_avg = 60000 / time_diffs[time_diffs.length - 1];
	}

	// compute current score
	var score = compute_score();

	// output bpm to display + graph
	$('#bpm_display').html(Math.round(bpm_avg));
	$('#score_display').html(Math.round(score));
	update_graph(Math.round(bpm_avg), Math.round(score), (time - time_first) / 1000);

	// save current time as past for next sample
	time_prev = time;

	return time;
}

function reset(time) {
	// save current time as past for next sample
	time_prev = time;
	time_first = time;

	// reset score
	time_diffs = [];

	// write out display
	$('#bpm_display').html('Calc')
	$('#score_display').html('Calc')

	// reset graph
	graph_len = 0;
	construct_graph();
}

function too_long(time_diff) {
	// max 5 seconds
	// min 2 seconds

	// protect against x/0
	if (bpm_avg == 0) {
		return time_diff > 5000;
	}

	// if 4 beats have passed with no user input, reset
	reset_beats = 4;
	reset_time = Math.min(5000, Math.max(2000, (60000 * reset_beats) / bpm_avg));
	return time_diff > reset_time;
}

function compute_score() {
	// find variance in time_diffs
	if (time_diffs.length == 1) {
		return 0;
	}

	// find mean
	var sum = 0;
	for (var i = 0; i < time_diffs.length; i++) {
		sum += time_diffs[i];
	}
	var mean = sum / time_diffs.length;

	// find score metric
	sum = 0;
	for (var i = 0; i < time_diffs.length; i++) {
		// variance
		// sum += Math.pow(time_diffs[i]-mean,2);
		// square root
		sum += 100 * Math.pow(Math.abs(time_diffs[i] - mean), 0.8);
	}
	var raw_score = sum / time_diffs.length;

	// map raw_score to score
	// variance - assumes 8000 worst score
	// var worst_score = 8000;
	// squareroot - assumes 1800 worst score
	var worst_score = 1600;
	var best_score = 800;
	// return raw_score;
	// constrain score to 0->1000
	return Math.min(1000, Math.max(1000 - 1000 / worst_score * (raw_score - best_score), 0));
}

function update_graph(bpm, score, time) {
	// reload chart data
	// only plot last 50 bpms

	// plot score against time?

	// if graph length > plot_len then delete as we go
	if (graph_len >= plot_len - 1) {
		// append to graph and remove one
		chart.flow({
			columns: [
				// ['x', time],
				["BPM", bpm],
				["Score", score]
			]
		});
	} else {
		// append but do not remove
		chart.flow({
			columns: [
				// ['x', time],
				["BPM", bpm],
				["Score", score]
			],
			length: 0
		});
		graph_len++;
	}
}

function construct_graph() {
	// display chart + options
	chart = c3.generate({
		bindto: '#myChart',
		size: {
			height: 600
		},
		data: {
			// x: 'x',
			columns: [
				// ['x'],
				["BPM"],
				["Score"]
			],
			axes: {
				BPM: 'y',
				Score: 'y2'
			},
			colors: {
				BPM: '#5cb85c',
				Score: '#5bc0de'
			}
		},
		axis: {
			x: {
				label: {
					text: 'Beats',
					position: 'outer-center'
				}
			},
			y: {
				padding: { bottom: 3 },
				label: {
					text: 'BPM',
					position: 'outer-middle'
				}
			},
			y2: {
				show: true,
				padding: { bottom: 3 },
				label: {
					text: 'Score',
					position: 'outer-middle'
				},
				min: 0,
				max: 1000
			}
		},
		grid: {
			x: {
				show: true
			},
			y: {
				show: true
			}
		},
		legend: {
			show: false
		},
		point: {
			show: false
		},
		transition: {
			duration: 100
		}
	});
}