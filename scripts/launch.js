const { spawn } = require('child_process');
const path = require('path');
const { getDotaPath } = require('./utils');

(async () => {
    const dotaPath = await getDotaPath();

    if (dotaPath === undefined) {
        console.log(`no DOTA2 installation found, addon launch is skipped`);
        return;
    }

    const win64 = path.join(dotaPath, 'game', 'bin', 'win64');

    let addon_name;
    let map_name;

    let script = process.env.npm_lifecycle_script ?? process.env.npm_package_scripts_launch;
    let params = script.match(/"(?:\\?[\S\s])*?"/g);
    if (params != null && params.length > 0) {
        if (params.length == 1) {
            map_name = params[0].replace(/"/g, '');
        } else {
            addon_name = params[0].replace(/"/g, '');
            map_name = params[1].replace(/"/g, '');
        }
    }

    if (process.env.npm_config_argv != null) {
        let argv = JSON.parse(process.env.npm_config_argv);
        if (argv.original != null && argv.original.length > 0) {
            let args = argv.original.slice(1);
            if (args[0] == `launch`) {
                // 如果有手动输入run的情况
                args = args.slice(1);
            }
            if (args.length > 0) {
                if (args.length == 1) {
                    map_name = args[0];
                }
                if (args.length >= 2) {
                    addon_name = args[0];
                    map_name = args[1];
                }
            }
        }
    } else console.log('Usage `yarn launch [[addon name] map name]`');

    let args = ['-novid', '-tools'];

    if ([`do`, `dota2`, `dop`, `doc`].includes(map_name)) {
        console.log(`let's play some dota! ${map_name == `dop` ? `-perfectworld` : map_name == `doc` ? `-steamchina` : ``}`);
        const args = [`-novid`].concat(map_name == `dop` ? [`-perfectworld`] : map_name == `doc` ? [`-steamchina`] : []);
        spawn(path.join(win64, 'dota2.exe'), args, { detached: true, cwd: win64 });
    } else {
        if (addon_name == undefined) addon_name = require('./addon.config.js').addon_name;

        args = args.concat(['-addon', addon_name]);

        if (map_name) {
            args.push(`+dota_launch_custom_game ${addon_name} ${map_name}`);
            console.log(`begin to load addon=>${addon_name}, map name=>${map_name}`);
        }

        spawn(path.join(win64, 'dota2.exe'), args, { detached: true, cwd: win64 });
        spawn(path.join(win64, 'vconsole2.exe'));
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
