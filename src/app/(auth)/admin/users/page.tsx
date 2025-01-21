'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import {
    UserCog,
    Search,
    Loader2,
    Shield,
    Users,
    UserCheck
} from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import type { UserRole } from '@/types/supabase'

export default function UsersManagement() {
    const { users, loading, updateUserRole } = useUsers()
    const [searchQuery, setSearchQuery] = useState('')

    // Filter users based on search query
    const filteredUsers = users.filter(user => {
        return user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        console.log('Changing role:', userId, newRole)
        const { error } = await updateUserRole(userId, newRole)
        if (error) {
            console.error('Failed to update role:', error)
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="h-4 w-4 text-blue-500" />
            case 'reviewer':
                return <UserCheck className="h-4 w-4 text-green-500" />
            case 'user':
                return <Users className="h-4 w-4 text-gray-500" />
            default:
                return null
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <main className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">
                        Manage user accounts and permissions
                    </p>
                </div>
                <Button className="gap-2">
                    <UserCog className="h-4 w-4" />
                    Add New User
                </Button>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Active</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        {user.email || 'No email found'}
                                        {process.env.NODE_ENV === 'development' && (
                                            <span className="text-xs text-gray-400 block">
                                                ID: {user.id}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role}
                                            onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <div className="flex items-center gap-2">
                                                    {getRoleIcon(user.role)}
                                                    <span className="capitalize">{user.role}</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-gray-500" />
                                                        <span>User</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="reviewer">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="h-4 w-4 text-green-500" />
                                                        <span>Reviewer</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="admin">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-4 w-4 text-blue-500" />
                                                        <span>Admin</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {user.status || 'active'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {user.last_sign_in_at
                                            ? new Date(user.last_sign_in_at).toLocaleString()
                                            : 'Never'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </main>
    )
}