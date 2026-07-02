import { Image, ImageStyle, StyleProp } from "react-native";

export type IconName =
  | "agregar"
  | "campana"
  | "capsulas"
  | "cara-decepcionada"
  | "cara-inexpresiva"
  | "cerrar-ojo"
  | "chatbot"
  | "comida"
  | "corazon"
  | "glucosa"
  | "haz-de-sonrisa"
  | "home"
  | "insulina"
  | "mas"
  | "md-del-usuario"
  | "medicamento"
  | "menu-puntos"
  | "nota"
  | "notificacion-de-campana-en-redes-sociales"
  | "ojo"
  | "peso"
  | "plan"
  | "presion"
  | "registros"
  | "ritmo-cardiaco"
  | "usuario"
  | "temperatura";

type IconImageProps = Readonly<{
  name: IconName;
  size?: number;
  tone?: "green" | "white";
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}>;

const greenIcons: Record<IconName, number> = {
  agregar: require("../../assets/icon/iconos/verdes/agregar.png"),
  campana: require("../../assets/icon/iconos/verdes/campana.png"),
  capsulas: require("../../assets/icon/iconos/verdes/capsulas.png"),
  "cara-decepcionada": require("../../assets/icon/iconos/verdes/cara-decepcionada.png"),
  "cara-inexpresiva": require("../../assets/icon/iconos/verdes/cara-inexpresiva.png"),
  // Solo existe una variante de este ícono (carpeta "blancos", pero el arte en sí es negro).
  "cerrar-ojo": require("../../assets/icon/iconos/blancos/cerrar-ojo.png"),
  chatbot: require("../../assets/icon/iconos/verdes/chatbot (1).png"),
  comida: require("../../assets/icon/iconos/verdes/comida.png"),
  corazon: require("../../assets/icon/iconos/verdes/corazon.png"),
  glucosa: require("../../assets/icon/iconos/verdes/glucosa.png"),
  "haz-de-sonrisa": require("../../assets/icon/iconos/verdes/haz-de-sonrisa (1).png"),
  home: require("../../assets/icon/iconos/verdes/home.png"),
  insulina: require("../../assets/icon/iconos/verdes/insulina.png"),
  mas: require("../../assets/icon/iconos/verdes/mas.png"),
  "md-del-usuario": require("../../assets/icon/iconos/verdes/md-del-usuario (1).png"),
  medicamento: require("../../assets/icon/iconos/verdes/medicamento.png"),
  "menu-puntos": require("../../assets/icon/iconos/verdes/menu-puntos.png"),
  nota: require("../../assets/icon/iconos/verdes/nota.png"),
  "notificacion-de-campana-en-redes-sociales": require("../../assets/icon/iconos/verdes/notificacion-de-campana-en-redes-sociales.png"),
  ojo: require("../../assets/icon/iconos/blancos/ojo.png"),
  peso: require("../../assets/icon/iconos/verdes/peso.png"),
  plan: require("../../assets/icon/iconos/verdes/plan.png"),
  presion: require("../../assets/icon/iconos/verdes/presion.png"),
  registros: require("../../assets/icon/iconos/verdes/registros.png"),
  "ritmo-cardiaco": require("../../assets/icon/iconos/verdes/ritmo-cardiaco.png"),
  usuario: require("../../assets/icon/iconos/verdes/usuario (1).png"),
  temperatura: require("../../assets/icon/iconos/verdes/temperatura.png"),
};

const whiteIcons: Record<IconName, number> = {
  agregar: require("../../assets/icon/iconos/blancos/agregar.png"),
  campana: require("../../assets/icon/iconos/blancos/campana.png"),
  capsulas: require("../../assets/icon/iconos/blancos/capsulas.png"),
  "cara-decepcionada": require("../../assets/icon/iconos/blancos/cara-decepcionada (1).png"),
  "cara-inexpresiva": require("../../assets/icon/iconos/blancos/cara-inexpresiva (1).png"),
  "cerrar-ojo": require("../../assets/icon/iconos/blancos/cerrar-ojo.png"),
  chatbot: require("../../assets/icon/iconos/blancos/chatbot.png"),
  comida: require("../../assets/icon/iconos/blancos/comida.png"),
  corazon: require("../../assets/icon/iconos/blancos/corazon.png"),
  glucosa: require("../../assets/icon/iconos/blancos/glucosa.png"),
  "haz-de-sonrisa": require("../../assets/icon/iconos/blancos/haz-de-sonrisa.png"),
  home: require("../../assets/icon/iconos/blancos/home.png"),
  insulina: require("../../assets/icon/iconos/blancos/insulina.png"),
  mas: require("../../assets/icon/iconos/blancos/mas.png"),
  "md-del-usuario": require("../../assets/icon/iconos/blancos/md-del-usuario.png"),
  medicamento: require("../../assets/icon/iconos/blancos/medicamento.png"),
  "menu-puntos": require("../../assets/icon/iconos/blancos/menu-puntos.png"),
  nota: require("../../assets/icon/iconos/blancos/nota.png"),
  "notificacion-de-campana-en-redes-sociales": require("../../assets/icon/iconos/blancos/notificacion-de-campana-en-redes-sociales.png"),
  ojo: require("../../assets/icon/iconos/blancos/ojo.png"),
  peso: require("../../assets/icon/iconos/blancos/peso.png"),
  plan: require("../../assets/icon/iconos/blancos/plan.png"),
  presion: require("../../assets/icon/iconos/blancos/presion-arterial.png"),
  registros: require("../../assets/icon/iconos/blancos/registros.png"),
  "ritmo-cardiaco": require("../../assets/icon/iconos/blancos/ritmo-cardiaco.png"),
  usuario: require("../../assets/icon/iconos/blancos/usuario.png"),
  temperatura: require("../../assets/icon/iconos/blancos/temperatura.png"),
};

export function IconImage({
  name,
  size = 24,
  tone = "green",
  style,
  accessibilityLabel,
}: Readonly<IconImageProps>) {
  const source = tone === "white" ? whiteIcons[name] : greenIcons[name];

  return (
    <Image
      accessibilityLabel={accessibilityLabel ?? name}
      source={source}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
    />
  );
}
