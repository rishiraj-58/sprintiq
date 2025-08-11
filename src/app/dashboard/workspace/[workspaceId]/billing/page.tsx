'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, 
  Check, 
  Download, 
  Calendar, 
  Shield, 
  Users, 
  Zap,
  Star,
  Crown,
  Building,
  ArrowRight
} from 'lucide-react';

// Static billing data
const currentPlan = {
  name: 'Pro',
  price: '$29',
  period: 'month',
  nextBilling: '2024-02-15',
  status: 'active'
};

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    period: 'month',
    description: 'Perfect for small teams getting started',
    icon: Users,
    features: [
      '5 team members',
      '3 active projects',
      '10GB storage',
      'Basic reporting',
      'Email support'
    ],
    limitations: [
      'No AI features',
      'Basic integrations only'
    ],
    current: false,
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'month',
    description: 'Best for growing teams with advanced needs',
    icon: Star,
    features: [
      '20 team members',
      '10 active projects',
      '100GB storage',
      'Advanced reporting',
      'AI task suggestions',
      'Priority support',
      'All integrations'
    ],
    limitations: [],
    current: true,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    period: 'month',
    description: 'For large organizations with enterprise needs',
    icon: Building,
    features: [
      'Unlimited team members',
      'Unlimited projects',
      '1TB storage',
      'Custom reporting',
      'Advanced AI features',
      'Dedicated support',
      'SSO & SAML',
      'Custom integrations',
      'Audit logs',
      'SLA guarantee'
    ],
    limitations: [],
    current: false,
    popular: false
  }
];

const paymentMethod = {
  type: 'visa',
  last4: '4242',
  expiryMonth: '12',
  expiryYear: '2025',
  name: 'John Doe'
};

const billingHistory = [
  {
    id: 'inv_001',
    date: '2024-01-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly',
    downloadUrl: '#'
  },
  {
    id: 'inv_002',
    date: '2023-12-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly',
    downloadUrl: '#'
  },
  {
    id: 'inv_003',
    date: '2023-11-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly',
    downloadUrl: '#'
  },
  {
    id: 'inv_004',
    date: '2023-10-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly',
    downloadUrl: '#'
  },
  {
    id: 'inv_005',
    date: '2023-09-15',
    amount: '$0.00',
    status: 'paid',
    description: 'Starter Plan - Monthly',
    downloadUrl: '#'
  }
];

export default function BillingPage() {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentPlan.name} Plan</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {currentPlan.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground">{currentPlan.price}</span>
                /{currentPlan.period}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Next billing date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {currentPlan.nextBilling}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-3">
            <Button variant="outline">Change Plan</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${plan.current ? 'bg-primary/5' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center space-y-4">
                  <Icon className="h-8 w-8 mx-auto text-primary" />
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-4 w-4 text-center text-muted-foreground shrink-0">×</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.current ? "secondary" : "default"}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    {!plan.current && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• {paymentMethod.last4}</p>
                <p className="text-sm text-muted-foreground">
                  Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear} • {paymentMethod.name}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">Update</Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Your payment information is encrypted and secure
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{invoice.description}</p>
                    <Badge variant="outline" className={getStatusBadgeColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Invoice #{invoice.id}</span>
                    <span>{invoice.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{invoice.amount}</span>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t text-center">
            <Button variant="outline">Load More Invoices</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}