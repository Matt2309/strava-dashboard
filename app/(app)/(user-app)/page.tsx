import { ActivityList } from "@/components/activities/ActivityList";
import {SiteHeader} from "@/components/sidebar/site-header";

export default async function Home() {
	return (
        <>
            <SiteHeader title={"Garage"}/>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6">
                        <ActivityList />
                    </div>
                </div>
            </div>
        </>
	);
}
