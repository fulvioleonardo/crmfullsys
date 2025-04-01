import React, { useState, useEffect, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import { toast } from "react-toastify";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.spacing(3),
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  paper: {
    padding: theme.spacing(3),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "600px",
    marginBottom: theme.spacing(2),
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  },
  titulo: {
    marginBottom: theme.spacing(2),
    fontWeight: "bold",
    color: "#333",
  },
  opcionConfiguracion: {
    marginLeft: "auto",
    minWidth: "150px",
  },
}));

const Configuraciones = () => {
  const classes = useStyles();

  const [configuraciones, setConfiguraciones] = useState([]);

  useEffect(() => {
    const obtenerConfiguraciones = async () => {
      try {
        const { data } = await api.get("/settings");
        setConfiguraciones(data);
      } catch (err) {
        toastError(err);
      }
    };
    obtenerConfiguraciones();
  }, []);

  useEffect(() => {
    const { companyId, id: userId } = useContext(AuthContext).user;
    const socket = socketConnection({ companyId, userId });

    socket.on(`company-${companyId}-settings`, (data) => {
      if (data.action === "update") {
        setConfiguraciones((prevState) => {
          const aux = [...prevState];
          const indice = aux.findIndex((s) => s.key === data.setting.key);
          aux[indice].value = data.setting.value;
          return aux;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const manejarCambioConfiguracion = async (e) => {
    const valorSeleccionado = e.target.value;
    const claveConfiguracion = e.target.name;

    try {
      await api.put(`/settings/${claveConfiguracion}`, {
        value: valorSeleccionado,
      });
      toast.success("Configuración actualizada con éxito");
    } catch (err) {
      toastError(err);
    }
  };

  const obtenerValorConfiguracion = (clave) => {
    const configuracion = configuraciones.find((s) => s.key === clave);
    return configuracion ? configuracion.value : "";
  };

  return (
    <div className={classes.root}>
      <Typography variant="h5" className={classes.titulo}>
        Configuraciones
      </Typography>
      <Paper className={classes.paper}>
        <Typography variant="body1">
          Permitir creación de usuarios
        </Typography>
        <Select
          margin="dense"
          variant="outlined"
          native
          id="configuracion-creacion-usuarios"
          name="userCreation"
          value={
            configuraciones.length > 0 && obtenerValorConfiguracion("userCreation")
          }
          className={classes.opcionConfiguracion}
          onChange={manejarCambioConfiguracion}
        >
          <option value="enabled">Habilitado</option>
          <option value="disabled">Deshabilitado</option>
        </Select>
      </Paper>
    </div>
  );
};

export default Configuraciones;
