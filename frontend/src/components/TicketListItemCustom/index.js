import React, { useState, useEffect, useRef, useContext, useCallback } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green, grey } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import GroupIcon from '@material-ui/icons/Group';
// import WhatsAppIcon from "@material-ui/icons/WhatsApp";
// import InstagramIcon from "@material-ui/icons/Instagram";
// import FacebookIcon from "@material-ui/icons/Facebook";


import TicketMessagesDialog from "../TicketMessagesDialog";
import ContactTag from "../ContactTag";
import ConnectionIcon from "../ConnectionIcon";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ShowTicketOpen from "../ShowTicketOpenModal";
import { isNil } from "lodash";
import { toast } from "react-toastify";
import { Done, HighlightOff, Replay, SwapHoriz } from "@material-ui/icons";
import useCompanySettings from "../../hooks/useSettings/companySettings";

// import contrastColor from "../../helpers/contrastColor";

const useStyles = makeStyles((theme) => ({
    ticket: {
        position: "relative",
    },

    pendingTicket: {
        cursor: "unset",
    },
    queueTag: {
        background: "#FCFCFC",
        color: "#000",
        marginRight: 1,
        padding: 1,
        fontWeight: 'bold',
        // paddingLeft: 5,
        // paddingRight: 5,
        borderRadius: 3,
        fontSize: "0.5em",
        whiteSpace: "nowrap"
    },
    noTicketsDiv: {
        display: "flex",
        height: "100px",
        margin: 40,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    newMessagesCount: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: 0,
        color: "green",
        fontWeight: "bold",
        marginRight: "-19px",
        borderRadius: 0,
    },
    noTicketsText: {
        textAlign: "center",
        color: "rgb(104, 121, 146)",
        fontSize: "14px",
        lineHeight: "1.4",
    },
    connectionTag: {
        background: "green",
        color: "#FFF",
        marginRight: 1,
        padding: 1,
        fontWeight: 'bold',
        // paddingLeft: 5,
        // paddingRight: 5,
        borderRadius: 3,
        fontSize: "0.6em",
        // whiteSpace: "nowrap"
    },
    noTicketsTitle: {
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "600",
        margin: "0px",
    },

    contactNameWrapper: {
        display: "flex",
        justifyContent: "space-between",
        marginLeft: "5px",
    },

    lastMessageTime: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: -30,
        marginRight: "1px"
    },

    lastMessageTimeUnread: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: -30,
        color: "green",
        fontWeight: "bold",
        marginRight: "1px",
    },

    closedBadge: {
        alignSelf: "center",
        justifySelf: "flex-end",
        marginRight: 32,
        marginLeft: "auto",
    },

    contactLastMessage: {
        paddingRight: "0%",
        marginLeft: "5px",
    },

    contactLastMessageUnread: {
        paddingRight: 20,
        fontWeight: "bold",
        color: theme.mode === 'light' ? "black" : "white",
        width: "50%"
    },

    badgeStyle: {
        color: "white",
        backgroundColor: green[500],
    },

    acceptButton: {
        position: "absolute",
        right: "1px",
    },


    // acceptButton: {
    //     position: "absolute",
    //     left: "50%",
    // },


    ticketQueueColor: {
        flex: "none",
        // width: "8px",
        height: "100%",
        position: "absolute",
        top: "0%",
        left: "0%",
    },

    ticketInfo: {
        position: "relative",
        top: -13
    },
    secondaryContentSecond: {
        display: 'flex',
        // marginBottom: 2,
        // marginLeft: "5px",
        alignItems: "flex-start",
        flexWrap: "nowrap",
        flexDirection: "row",
        alignContent: "flex-start",
        // height: "10px"
    },
    ticketInfo1: {
        position: "relative",
        top: 13,
        right: 0
    },
    Radiusdot: {
        "& .MuiBadge-badge": {
            borderRadius: 2,
            position: "inherit",
            height: 16,
            margin: 2,
            padding: 3
        },
        "& .MuiBadge-anchorOriginTopRightRectangle": {
            transform: "scale(1) translate(0%, -40%)",
        },

    },
    connectionIcon: {
        marginRight: theme.spacing(1)
    },

    presence: {
        color: theme?.mode === 'light' ? "green" : "lightgreen",
        fontWeight: "bold",
    }
}));

// const TicketListItemCustom = ({ handleChangeTab, ticket }) => {
const TicketListItemCustom = ({ ticket }) => {
    const classes = useStyles();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [ticketUser, setTicketUser] = useState(null);
    const [tag, setTag] = useState([]);

    const [whatsAppName, setWhatsAppName] = useState(null);
    const [acceptTicketWithouSelectQueueOpen, setAcceptTicketWithouSelectQueueOpen] = useState(false);
    const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);

    const presenceMessage = { composing: "Digitando...", recording: "Gravando..." };

    const [openAlert, setOpenAlert] = useState(false);
    const [userTicketOpen, setUserTicketOpen] = useState("");
    const [queueTicketOpen, setQueueTicketOpen] = useState("");

    // const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { setCurrentTicket } = useContext(TicketsContext);
    const { user } = useContext(AuthContext);

    const { get: getSetting } = useCompanySettings();

    useEffect(() => {
        if (ticket.userId && ticket.user) {
            setTicketUser(ticket?.user?.name.toUpperCase());
        }

        setWhatsAppName(ticket?.whatsapp?.name.toUpperCase());

        setTag(ticket?.tags);

        return () => {
            isMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenAcceptTicketWithouSelectQueue = useCallback(() => {
      
        setAcceptTicketWithouSelectQueueOpen(true);
    }, []);

    const handleCloseTicket = async (id) => {
        const setting = await getSetting(
            {
                "column": "requiredTag"
            }
        );

        if (setting.requiredTag === "enabled") {
            //verificar se tem uma tag   
            try {
                const contactTags = await api.get(`/contactTags/${ticket.contact.id}`);
                if (!contactTags.data.tags) {
                    toast.warning(i18n.t("messagesList.header.buttons.requiredTag"))
                } else {
                    await api.put(`/tickets/${id}`, {
                        status: "closed",
                        userId: user?.id || null,
                        promptId: null,
                    });

                    if (isMounted.current) {
                        setLoading(false);
                    }
                    history.push(`/tickets/`);
                }
            } catch (err) {
                setLoading(false);
                toastError(err);
            }
        } else {
            setLoading(true);
            try {
                await api.put(`/tickets/${id}`, {
                    status: "closed",
                    userId: user?.id || null,
                });

            } catch (err) {
                setLoading(false);
                toastError(err);
            }
            if (isMounted.current) {
                setLoading(false);
            }
            history.push(`/tickets/`);
        }

    };

    const handleCloseIgnoreTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "closed",
                userId: user?.id || null,
                sendFarewellMessage: false,
                amountUsedBotQueues: 0
            });

        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/`);
    };

    const truncate = (str, len) => {
        if (!isNil(str)) {
            if (str.length > len) {
                return str.substring(0, len) + "...";
            }
            return str;
        }
    };

    const handleCloseTransferTicketModal = useCallback(() => {
        if (isMounted.current) {
            setTransferTicketModalOpen(false);
        }
    }, []);

    const handleOpenTransferModal = useCallback(() => {
        setLoading(true)
        setTransferTicketModalOpen(true);
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    }, [])

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            const otherTicket = await api.put(`/tickets/${id}`, {
                status: ticket.isGroup && ticket.channel === 'whatsapp' ? "group" : "open",
                userId: user?.id,
            });

            if (otherTicket.data.id !== ticket.id) {
                if (otherTicket.data.userId !== user?.id) {
                    setOpenAlert(true)
                    setUserTicketOpen(otherTicket.data.user.name)
                    setQueueTicketOpen(otherTicket.data.queue.name)
                } else {
                    setLoading(false);
                    // handleChangeTab(null, ticket.isGroup? "group" : "open");
                    history.push(`/tickets/${otherTicket.data.uuid}`);
                }
            } else {
                let setting;

                try {
                    setting = await getSetting({
                        "column": "sendGreetingAccepted"
                    })
                } catch (err) {
                    toastError(err);
                }

                if (setting.sendGreetingAccepted === "enabled" && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")) {
                    handleSendMessage(ticket.id);
                }
                if (isMounted.current) {
                    setLoading(false);
                }

                // handleChangeTab(null, "tickets");
                // handleChangeTab(null, ticket.isGroup? "group" : "open");
                history.push(`/tickets/${ticket.uuid}`);
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }

    };

    // const handleClose = () => {
    //     setOpenTicketMessageDialog(false);
    // };

    const handleSendMessage = async (id) => {
        const msg = `{{ms}} *{{name}}*, ${i18n.t("mainDrawer.appBar.user.myName")} *${user?.name}* ${i18n.t("mainDrawer.appBar.user.continuity")}.`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `*${i18n.t("mainDrawer.appBar.user.virtualAssistant")}:*\n${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
        }
    };

    const handleCloseAlert = useCallback(() => {
        setOpenAlert(false);
        setLoading(false);
    }, []);

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    };

    return (
        <React.Fragment key={ticket.id}>
            <ShowTicketOpen
                isOpen={openAlert}
                handleClose={handleCloseAlert}
                user={userTicketOpen}
                queue={queueTicketOpen}
            />
            <AcceptTicketWithouSelectQueue
                modalOpen={acceptTicketWithouSelectQueueOpen}
                onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
                ticketId={ticket.id}
                ticket={ticket}
            />
            <TransferTicketModalCustom
                modalOpen={transferTicketModalOpen}
                onClose={handleCloseTransferTicketModal}
                ticketid={ticket.id}
                ticket={ticket}
            />

            {/* <TicketMessagesDialog
                open={openTicketMessageDialog}
                handleClose={() => setOpenTicketMessageDialog(false)}
                ticketId={ticket.id}
            /> */}

            <ListItem dense button
                onClick={(e) => {
                    handleSelectTicket(ticket);
                }}
                selected={ticketId && ticketId === ticket.uuid}
                className={clsx(classes.ticket, {
                    [classes.pendingTicket]: ticket.status === "pending",
                })}
            >

                <ListItemAvatar
                    style={{ marginLeft: "-15px" }}
                >
                    <Avatar
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                        }}
                        src={`${ticket?.contact?.urlPicture}`}

                    />
                </ListItemAvatar>
                <ListItemText
                    disableTypography
                    primary={
                        <span className={classes.contactNameWrapper}>
                            <Typography
                                noWrap
                                component="span"
                                variant="body2"
                                color="textPrimary"
                            >
                                {ticket.isGroup && ticket.channel === "whatsapp" && <GroupIcon fontSize="small" style={{ color: grey[700], marginBottom: '-1px', marginLeft: '5px' }} />} &nbsp;
                                {ticket.channel && <ConnectionIcon width="20" height="20" className={classes.connectionIcon} connectionType={ticket.channel} />} &nbsp;
                                {truncate(ticket.contact?.name, 60)}
                                {/* {profile === "admin"  && ( */}
                                {/* <Tooltip title="Espiar Conversa">
                                        <VisibilityIcon
                                            onClick={() => setOpenTicketMessageDialog(true)}
                                            fontSize="small"
                                            style={{
                                                color: blue[700],
                                                cursor: "pointer",
                                                marginLeft: 10,
                                                verticalAlign: "middle"
                                            }}
                                        />
                                    </Tooltip> */}
                                {/* )} */}
                            </Typography>
                            {/* <ListItemSecondaryAction>
                                <Box className={classes.ticketInfo1}>{renderTicketInfo()}</Box>
                            </ListItemSecondaryAction> */}
                        </span>
                    }
                    secondary={
                        <span className={classes.contactNameWrapper}>

                            <Typography
                                className={Number(ticket.unreadMessages) > 0 ? classes.contactLastMessageUnread : classes.contactLastMessage}
                                noWrap
                                component="span"
                                variant="body2"
                                color="textSecondary"
                         
                            >
                                {["composing", "recording"].includes(ticket?.presence) ? (
                                    <span className={classes.presence}>
                                        {presenceMessage[ticket.presence]}
                                    </span>
                                ) :
                                    <>
                                        {ticket.lastMessage ? (
                                            <>
                                                {ticket.lastMessage.includes('data:image/png;base64') ? <MarkdownWrapper>Localização</MarkdownWrapper> :

                                                    <> {ticket.lastMessage.includes('BEGIN:VCARD') ?
                                                        <MarkdownWrapper>Contato</MarkdownWrapper> :
                                                        <MarkdownWrapper>{truncate(ticket.lastMessage, 40)}</MarkdownWrapper>}
                                                    </>
                                                }
                                            </>
                                        ) : (
                                            <br />
                                        )}

                                        ""
                                    </>
                                }
                                <span className={classes.secondaryContentSecond} >
                                    {whatsAppName ? <Badge className={classes.connectionTag}>{whatsAppName}</Badge> : <br></br>}
                                    {<Badge style={{ backgroundColor: ticket.queue?.color || "#7c7c7c" }} className={classes.connectionTag}>{ticket.queue?.name.toUpperCase() || "SIN COLA"}</Badge>}
                                    {ticketUser && (<Badge style={{ backgroundColor: "#000000" }} className={classes.connectionTag}>{ticketUser}</Badge>)}
                                </span>
                                <span className={classes.secondaryContentSecond} >
                                    {
                                        tag?.map((tag) => {
                                            return (
                                                <ContactTag tag={tag} key={`ticket-contact-tag-${ticket.id}-${tag.id}`} />
                                            );
                                        })
                                    }
                                </span>
                            </Typography>

                            <Badge
                                className={classes.newMessagesCount}
                                badgeContent={ticket.unreadMessages}
                                classes={{
                                    badge: classes.badgeStyle,
                                }}
                            />
                        </span>
                    }

                />
                <ListItemSecondaryAction>
                    {ticket.lastMessage && (
                        <>

                            <Typography
                                className={Number(ticket.unreadMessages) > 0 ? classes.lastMessageTimeUnread : classes.lastMessageTime}
                                component="span"
                                variant="body2"
                                color="textSecondary"
                            >

                                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                                ) : (
                                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                                )}
                            </Typography>

                            <br />

                        </>
                    )}

                </ListItemSecondaryAction>
                <ListItemSecondaryAction>
                    <span className={classes.secondaryContentSecond}>
                        {(ticket.status === "pending" && (ticket.queueId === null || ticket.queueId === undefined)) && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'green', padding: '0px', borderRadius: "50%", right: '51px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleOpenAcceptTicketWithouSelectQueue()}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                                    <Done />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "pending" && ticket.queueId !== null) && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'green', padding: '0px', borderRadius: "50%", right: '51px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleAcepptTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                                    <Done />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond1} >
                        {(ticket.status === "pending" || ticket.status === "open" || ticket.status === "group") && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'purple', padding: '0px', borderRadius: "50%", right: '26px', position: 'absolute', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={handleOpenTransferModal}
                            >
                                {/* {i18n.t("ticketsList.buttons.transfer")} */}
                                <Tooltip title={`${i18n.t("ticketsList.buttons.transfer")}`}>
                                    <SwapHoriz />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "open" || ticket.status === "group") && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'red', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleCloseTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.closed")}`}>
                                    <HighlightOff />
                                    {/*  */}
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "pending") && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'red', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleCloseIgnoreTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.ignore")}`}>
                                    <HighlightOff />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "closed" && (ticket.queueId === null || ticket.queueId === undefined)) && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'orange', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleOpenAcceptTicketWithouSelectQueue()}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                                    <Replay />
                                </Tooltip>
                            </ButtonWithSpinner>

                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "closed" && ticket.queueId !== null) && (
                            <ButtonWithSpinner
                                //color="primary"
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'orange', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleAcepptTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                                    <Replay />
                                </Tooltip>
                            </ButtonWithSpinner>

                        )}
                    </span>
                </ListItemSecondaryAction>
            </ListItem>

            <Divider variant="inset" component="li" />
        </React.Fragment>
    );
};

export default TicketListItemCustom;