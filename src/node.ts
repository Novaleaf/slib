export import os = require( "os" );


let cpuCount = os.cpus().length;

export function getCpuUsagePercent() {
	try {
		return os.loadavg()[ 0 ] / cpuCount;
	} catch{
		return Number.NaN;
	}
}