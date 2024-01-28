import { merge } from "lodash-es";

export const extend = <Y, T>(source: Y, obj: T & Y) => {
	return merge(source, obj);
};
