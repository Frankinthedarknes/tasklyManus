declare module "react-native-deck-swiper" {
  import type { Component, ReactNode } from "react";
  import type { StyleProp, ViewStyle } from "react-native";

  export type SwiperProps<T> = {
    cards: T[];
    renderCard: (card: T, index: number) => ReactNode;
    onSwiped?: (index: number) => void;
    onSwipedLeft?: (index: number) => void;
    onSwipedRight?: (index: number) => void;
    onSwipedAll?: () => void;
    cardIndex?: number;
    stackSize?: number;
    backgroundColor?: string;
    cardVerticalMargin?: number;
    cardHorizontalMargin?: number;
    infinite?: boolean;
    disableTopSwipe?: boolean;
    disableBottomSwipe?: boolean;
    verticalSwipe?: boolean;
    overlayLabels?: Record<string, unknown>;
    containerStyle?: StyleProp<ViewStyle>;
    cardStyle?: StyleProp<ViewStyle>;
  };

  export default class Swiper<T> extends Component<SwiperProps<T>> {}
}
