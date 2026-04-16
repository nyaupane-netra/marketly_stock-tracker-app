'use client';

import React from 'react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {useRouter} from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {Button} from "@/components/ui/button";
import {LogOut, Settings} from "lucide-react";
import NavItems from "@/components/NavItems";
import {signOut} from "@/lib/actions/auth.actions";
import ProfileSettingsDialog from "@/components/ProfileSettingsDialog";

const UserDropdown = ({ user, initialStocks }: {user: User, initialStocks: StockWithWatchlistStatus[]}) => {
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }


    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 text-gray-400 hover:text-yellow-500">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div className="hidden md:flex flex-col items-start">
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                        </div>

                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-600 text-gray-400">

                    <DropdownMenuLabel>
                        <div className="flex relative items-center gap-3 py-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.image || undefined} />
                                <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                    {user.name[0]}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col">
                            <span className='text-base font-medium text-gray-400'>
                                {user.name}
                            </span>
                                <span className="text-sm text-gray-500">{user.email}</span>
                                {user.phoneNumber && <span className="text-xs text-gray-500">{user.phoneNumber}</span>}
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-600"/>
                    <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
                        <Settings className="h-4 w-4 mr-2 hidden sm:block" />
                        Profile settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                        Logout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="hidden sm:block bg-gray-600"/>
                    <nav className="sm:hidden">
                        <NavItems initialStocks={initialStocks} />
                    </nav>

                </DropdownMenuContent>
            </DropdownMenu>
            <ProfileSettingsDialog user={user} open={isProfileOpen} onOpenChange={setIsProfileOpen} />
        </>
    )
}
export default UserDropdown
