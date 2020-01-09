import React, {Fragment, useState} from 'react';
import './App.css';

import {
    AppBar,
    Backdrop,
    Box,
    Button,
    Container,
    Dialog,
    Divider,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Paper,
    Toolbar,
    IconButton,
    Typography,
    ListItemSecondaryAction
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
}));

const UUID_GATEWAY_GATT_SERVICE = '0fda92b2-44a2-4af2-84f5-fa682baa2b8d';
const UUID_GATEWAY_GATT_CHAR_WIFI_SERVICES = "d7515033-7e7b-45be-803f-c8737b171a29";
const UUID_GATEWAY_GATT_CHAR_WIFI_SSID = "7731de63-bc6a-4100-8ab1-89b2356b038b";
const UUID_GATEWAY_GATT_CHAR_WIFI_CONNECT = "398168aa-0111-4ec0-b1fa-171671270608";
const UUID_GATEWAY_GATT_CHAR_MAC = "9c4314f2-8a0c-45fd-a58d-d4a7e64c3a57";
const UUID_GATEWAY_GATT_CHAR_PUBKEY = "0a852c59-50d3-4492-bfd3-22fe58a24f01";
const UUID_GATEWAY_GATT_CHAR_ONBOARDING_KEY = "d083b2bd-be16-4600-b397-61512ca2f5ad";
const UUID_GATEWAY_GATT_CHAR_ADD_GW = "df3b16ca-c985-4da2-a6d2-9b9b9abdb858";
const UUID_GATEWAY_GATT_CHAR_ASSERT_LOC = "d435f5de-01a4-4e7d-84ba-dfd347f60275";
const UUID_GATEWAY_GATT_CHAR_DIAGNOSTICS = "b833d34f-d871-422c-bf9e-8e6ec117d57e";
const UUID_GATEWAY_GATT_CHAR_LIGHTS = "180efdef-7579-4b4a-b2df-72733b7fa2fe";

const DeviceInformationCharacteristics = [
    { key: "manufacturer_name", name: "Manufacturer", uuid: "manufacturer_name_string" },
    /* { key: "model_number", name: "Model Number", uuid: "model_number_string"},*/
    /*{ key: "serial_number", uuid: "serial_number_string"},*/
    /* { key: "hardware_revision", name: "Hardware Version", uuid: "hardware_revision_string" }, */
    { key: "firmware_revision", name: "Firmware Version", uuid: "firmware_revision_string"}
]
const GatewayInfoCharacteristics = [
    { key: "wifi_ssid", name: 'Wi-Fi SSID', uuid: UUID_GATEWAY_GATT_CHAR_WIFI_SSID},
    { key: "mac_addr", name: 'MAC Address', uuid: UUID_GATEWAY_GATT_CHAR_MAC},
    { key: "public_key", name: 'Public Key', uuid: UUID_GATEWAY_GATT_CHAR_PUBKEY},
    { key: "onboarding_key", name: 'Onboarding Key', uuid: UUID_GATEWAY_GATT_CHAR_ONBOARDING_KEY}
]

function HotspotConfigurator({setStatus}) {
    const classes = useStyles();

    const [device, setDevice] = useState(null);
    const [deviceInfo, setDeviceInfo] = useState(null);

    let utf8decoder = new TextDecoder();
    const readCharacteristics = async (info, service, characteristics) => {
        for (const char of characteristics) {
            console.log("Getting Char for: " + char.uuid)
            const c = await service.getCharacteristic(char.uuid);
            const v = utf8decoder.decode(await c.readValue());
            info[char.key] = v;
        }
    }
    const selectHotspot = async () => {
        try {
            const info = {};
            setStatus('Selecting device...');
            console.log("Connecting to device...");
            const device = await navigator.bluetooth.requestDevice({filters: [{namePrefix: "Helium Hotspot ", optionalServices: ["device_information", UUID_GATEWAY_GATT_SERVICE]}]});
            console.log(device);
            setDevice(device);

            setStatus('Connecting to GATT Server...');
            console.log('Connecting to GATT Server...');
            const server = await device.gatt.connect();

            setStatus('Getting Device Information Service...');
            console.log('Getting Device Information Service...')
            let deviceService = await server.getPrimaryService("device_information");

            setStatus('Reading DeviceInformationCharacteristics...');
            await readCharacteristics(info, deviceService, DeviceInformationCharacteristics);

            setStatus('Getting Gateway Service...');
            console.log('Getting Gateway Service...');
            const gatewayService = await server.getPrimaryService(UUID_GATEWAY_GATT_SERVICE);

            setStatus('Reading GatewayInfoCharacteristics...');
            await readCharacteristics(info, gatewayService, GatewayInfoCharacteristics);

            console.log(info);

            setDeviceInfo(info);
            setStatus(null);
        }
        catch (error) {
            console.log(error.message);
            alert(error.message);
            reset();
        }
    };
    const reset = () => {
        try {
            device.gatt.disconnect();
        } catch {}
        setDevice(null);
        setDeviceInfo(null);
        window.location.reload()
    };

    const infoListItems = (info, charArray) => {
        if (device == null || deviceInfo == null) return;
        return charArray.map((value, index) => {
            let val = info[value.key];
            let lit = "";
            if (val.length > 30) {
                return <Fragment key={value.key + "_fragment"}>
                    <ListItem key={value.key}>
                        <ListItemText primary={value.name} secondary={info == null ? null : info[value.key]}/>
                    </ListItem>
                    <ListItem key={value.key + "_divider"} divider={true}/>
                </Fragment>
            } else {
                return <Fragment key={value.key + "_fragment"}>
                    <ListItem key={value.key}>
                        <ListItemText primary={value.name} secondary={info == null ? null : info[value.key]}/>
                    </ListItem>
                    <ListItem key={value.key + "_divider"} divider={true}/>
                </Fragment>
            }
        });
    };

    const showHotspotSelectorPanel = () => {
        if (device == null) return <Fragment>
            <ListItem>
                <Box className="deviceSelectorPanel">
                    <Typography variant="h6">Bluetooth Pairing Required</Typography>
                    <Typography>Pair over Bluetooth to configure Hotspot settings.  Press the paring button on the Hotspot to continue.</Typography>
                    <Button variant="contained" color="primary" onClick={selectHotspot}>Scan for Hotspots</Button>
                </Box>
            </ListItem>
        </Fragment>

    };
    return (
        <Box>
            <AppBar position="static">
                <Toolbar>
                    {(device != null) && <IconButton className={classes.menuButton} color="inherit" aria-label="menu">
                        <MenuIcon />
                    </IconButton>}
                    <Typography variant="h6" className={classes.title}>
                        {(device == null)? "Helium Hotspot Config" : device.name}
                    </Typography>
                    {(device != null) && <IconButton color="inherit" aria-label="menu" onClick={reset}>
                        <CloseIcon />
                    </IconButton>}
                </Toolbar>
            </AppBar>
            <List dense={true}>
                {showHotspotSelectorPanel()}
                {infoListItems(deviceInfo, DeviceInformationCharacteristics)}
                {infoListItems(deviceInfo, GatewayInfoCharacteristics)}
            </List>
        </Box>
    )
}

function App() {
    const [status, setStatus] = useState(null);

    return (
        <Container maxWidth="xs">
            <Dialog open={!(status == null)} >
                <Box>{status}</Box>
                <LinearProgress />
            </Dialog>
            <HotspotConfigurator setStatus={setStatus} />
        </Container>
    );
}

export default App;
